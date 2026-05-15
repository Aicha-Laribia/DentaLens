import requests

key = "gsk_fausse_cle_123" # Votre clé
headers = {"Authorization": f"Bearer {key}"}
r = requests.get("https://api.groq.com/openai/v1/models", headers=headers)

if r.status_code == 200:
    print("✅ Clé Valide !")
else:
    print(f"❌ Erreur: {r.text}")