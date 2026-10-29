package ar.nacho.satelite;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import org.json.JSONArray;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Lo que Satélite guarda en el celu, cifrado con una llave del Keystore de Android
 * (la llave nunca sale del chip de seguridad del celu y no viaja en las copias de seguridad).
 */
final class Almacen {
    private static final String ALIAS = "satelite-v1";
    private final SharedPreferences p;

    Almacen(Context c) {
        p = c.getApplicationContext().getSharedPreferences("satelite", Context.MODE_PRIVATE);
    }

    private static SecretKey llave() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(ALIAS)) {
            return ((KeyStore.SecretKeyEntry) ks.getEntry(ALIAS, null)).getSecretKey();
        }
        KeyGenerator g = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        g.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build());
        return g.generateKey();
    }

    synchronized String leer(String k) {
        String v = p.getString(k, null);
        if (v == null) return null;
        try {
            byte[] b = Base64.decode(v, Base64.NO_WRAP);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, llave(), new GCMParameterSpec(128, b, 0, 12));
            return new String(c.doFinal(b, 12, b.length - 12), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    synchronized void guardar(String k, String v) {
        if (v == null) {
            p.edit().remove(k).apply();
            return;
        }
        try {
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, llave());
            byte[] iv = c.getIV();
            byte[] x = c.doFinal(v.getBytes(StandardCharsets.UTF_8));
            byte[] out = new byte[iv.length + x.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(x, 0, out, iv.length, x.length);
            p.edit().putString(k, Base64.encodeToString(out, Base64.NO_WRAP)).apply();
        } catch (Exception e) {
            // Sin Keystore no se guarda nada: mejor perder un aviso que dejarlo en claro.
        }
    }

    synchronized JSONArray lista(String k) {
        try {
            String v = leer(k);
            return v == null ? new JSONArray() : new JSONArray(v);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    synchronized void lista(String k, JSONArray a) {
        guardar(k, a == null ? null : a.toString());
    }

    // Contadores y horas: no son datos sensibles, van sin cifrar.
    long num(String k) { return p.getLong("n_" + k, 0); }
    void num(String k, long v) { p.edit().putLong("n_" + k, v).apply(); }
    String texto(String k) { return p.getString("t_" + k, null); }
    void texto(String k, String v) { if (v == null) p.edit().remove("t_" + k).apply(); else p.edit().putString("t_" + k, v).apply(); }
}
