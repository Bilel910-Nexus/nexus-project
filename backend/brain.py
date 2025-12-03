import chromadb
from chromadb.utils import embedding_functions

# 1. On initialise la mémoire (ça va créer un dossier 'nexus_db' sur ton PC)
client = chromadb.PersistentClient(path="./nexus_db")

# 2. On choisit le modèle d'IA (le "traducteur" Texte -> Maths)
# all-MiniLM-L6-v2 est léger, rapide et gratuit.
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

# 3. On crée la collection (le dossier de rangement dans la mémoire)
collection = client.get_or_create_collection(name="nexus_knowledge", embedding_function=sentence_transformer_ef)

def remember(text: str, category: str):
    """Fonction pour ajouter un souvenir"""
    # On crée un ID unique pour chaque info
    doc_id = str(hash(text))
    collection.add(
        documents=[text],
        metadatas=[{"source": category}],
        ids=[doc_id]
    )
    return True

def recall(query: str):
    """Fonction pour chercher un souvenir pertinent"""
    print(f"Recherche de : {query}") # Pour voir ce qui se passe dans le terminal
    
    results = collection.query(
        query_texts=[query],
        n_results=1
    )
    
    # Correction du crash : on vérifie qu'il y a bien des documents DANS la liste
    if results['documents'] and results['documents'][0]:
        return results['documents'][0][0]
        
    return "Je ne trouve rien dans ma mémoire à ce sujet. Apprends-moi d'abord !"
def get_all_memories():
    """Récupère tous les souvenirs stockés"""
    # On demande tout le contenu de la collection
    all_data = collection.get()
    
    # On reformate ça proprement pour le frontend
    memories = []
    if all_data['documents']:
        for i, doc in enumerate(all_data['documents']):
            memories.append({
                "id": all_data['ids'][i],
                "text": doc,
                "category": all_data['metadatas'][i].get('source', 'Unknown')
            })
    return memories