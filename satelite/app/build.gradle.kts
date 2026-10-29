plugins {
    id("com.android.application")
}

// La versión sale del número de armado en GitHub: 1.0.N.
val armado = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 1

android {
    namespace = "ar.nacho.satelite"
    compileSdk = 35

    defaultConfig {
        applicationId = "ar.nacho.satelite"
        minSdk = 26
        targetSdk = 35
        versionCode = armado
        versionName = "1.0.$armado"
    }

    // La firma vive fuera del repo: GitHub la arma con el secreto SATELITE_CLAVE (ver .github/workflows/satelite.yml).
    signingConfigs {
        create("propia") {
            storeFile = file(System.getenv("SAT_FIRMA") ?: "firma.jks")
            storePassword = System.getenv("SAT_CLAVE") ?: ""
            keyAlias = "satelite"
            keyPassword = System.getenv("SAT_CLAVE") ?: ""
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("propia")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
}
