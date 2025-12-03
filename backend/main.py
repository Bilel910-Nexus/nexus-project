from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import os
import json

# --- 1. CONFIGURATION ---
# On demande au système la clé, on ne l'écrit plus ici !
API_KEY = os.environ.get("GROQ_API_KEY")

client = Groq(api_key=API_KEY)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <--- METTRE UNE ÉTOILE ICI (Ça veut dire : Tout le monde rentre)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. GESTION FICHIER ---
DATA_FILE = "memories.json"

def load_memories():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return [
        {"id": 1, "text": "Système Nexus initialisé", "category": "system"},
        {"id": 2, "text": "Mémoire persistante activée", "category": "system"},
    ]

def save_memories():
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(MEMORIES, f, indent=4)

MEMORIES = load_memories()

# --- 3. LE CERVEAU (PROMPT AMÉLIORÉ) ---
@app.get("/ask")
def ask_nexus(question: str):
    current_memories = "\n".join([f"- {m['text']}" for m in MEMORIES])

    # C'EST ICI QUE TOUT CHANGE 👇
    system_prompt = f"""
    Tu es NEXUS, une IA connectée à une interface neurale.
    
    TON OBJECTIF :
    Tu dois analyser la phrase de l'utilisateur. S'il te donne une information, tu dois l'extraire précisément.
    
    FORMAT OBLIGATOIRE DE RÉPONSE :
    Si tu détectes une info, commence par "MEMORISE:" suivi de l'info, puis "|", puis ta réponse.
    
    EXEMPLES À SUIVRE (Imite ça) :
    - User: "Je m'appelle Bilel."
      Toi: MEMORISE:Utilisateur s'appelle Bilel|Enchanté Bilel. Identité enregistrée.
      
    - User: "J'adore le code React."
      Toi: MEMORISE:Utilisateur passionné par React|C'est noté. Une compétence clé ajoutée au noyau.
      
    - User: "Mon projet est fini."
      Toi: MEMORISE:Projet actuel terminé|Félicitations. Archivage de la réussite.

    - User: "Salut ça va ?"
      Toi: Systèmes opérationnels. En attente d'instructions.

    ATTENTION : Ne jamais écrire "Le fait résumé". Écris le VRAI contenu.
    
    Souvenirs actuels :
    {current_memories}
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant", 
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.7,
            max_tokens=150,
        )
        
        full_response = completion.choices[0].message.content
        final_response = full_response

        if "MEMORISE:" in full_response:
            try:
                parts = full_response.split("MEMORISE:")[1].split("|")
                memory_text = parts[0].strip()
                final_response = parts[1].strip()
                
                # Vérification de sécurité pour ne pas enregistrer du vide
                if memory_text and len(memory_text) > 3:
                    MEMORIES.append({"id": len(MEMORIES) + 1, "text": memory_text, "category": "ai"})
                    save_memories()
            except:
                pass

        return {"response": final_response}

    except Exception as e:
        return {"response": f"ERREUR : {str(e)}"}

@app.get("/galaxy")
def get_galaxy():
    return MEMORIES

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)