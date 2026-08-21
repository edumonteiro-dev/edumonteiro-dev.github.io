# verify_build.py
import zipfile
import re
import sys
import os

ZIP_NAME = "Vibecoder v11.0.9 ftcookies hotfix.zip"
EXPECTED_LOCALES = ["de-CH", "pt-PT", "en-US", "fr-CH", "es-ES", "it-IT"]
EXPECTED_COOKIES = {
    "de-CH": "Cookie-Verwaltung",
    "pt-PT": "Gestão de Cookies",
    "en-US": "Cookie Management",
    "fr-CH": "Gestion des témoins",
    "es-ES": "Gestión de Cookies",
    "it-IT": "Gestione dei cookie"
}

def run_audit():
    if not os.path.exists(ZIP_NAME):
        print(f"[FATAL] Ficheiro {ZIP_NAME} não encontrado.")
        sys.exit(1)

    print(f"[QA INIT] A auditar {ZIP_NAME}...")
    
    with zipfile.ZipFile(ZIP_NAME, 'r') as z:
        if 'i18n.js' not in z.namelist():
            print("[FATAL] i18n.js não encontrado no arquivo.")
            sys.exit(1)
            
        content = z.read('i18n.js').decode('utf-8')
        
        # 1. Validar estrutura base do objeto VC_I18N
        for loc in EXPECTED_LOCALES:
            if f"'{loc}': {{" not in content and f'"{loc}": {{' not in content:
                print(f"[FAIL] Locale {loc} não inicializado corretamente.")
                sys.exit(1)
                
        # 2. Validar valores exatos do ftCookies
        for loc, expected_val in EXPECTED_COOKIES.items():
            # Extrai o bloco do locale
            block_match = re.search(r"['\"]" + loc + r"['\"]:\s*\{([\s\S]*?)(?=\n  ['\"][a-z]{2}-[A-Z]{2}['\"]|\n\};)", content)
            if not block_match:
                print(f"[FAIL] Bloco do locale {loc} inacessível.")
                sys.exit(1)
                
            block = block_match.group(1)
            if expected_val not in block:
                print(f"[FAIL] ftCookies no locale {loc} não corresponde ao esperado: '{expected_val}'.")
                sys.exit(1)

        # 3. Validar chaves injetadas do Blog
        required_blog_keys = ["art01Title", "art10Desc", "wip", "readLabel"]
        for key in required_blog_keys:
            count = content.count(f"{key}:")
            if count != 6:
                print(f"[FAIL] Chave {key} encontrada {count} vezes. Esperado: 6.")
                sys.exit(1)

    print("\n[SEC-PASS] Auditoria concluída. 6 locales intactos. Rodapé validado. Zero anomalias.")
    print("           A Release v11.0.9 está pronta para Deploy em Produção.")

if __name__ == "__main__":
    run_audit()