from flask import Flask, request
from flask_socketio import SocketIO, send, emit
from flask_cors import CORS

from langchain.document_loaders import YoutubeLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain.chains import LLMChain
from dotenv import find_dotenv, load_dotenv
from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
import textwrap

app = Flask(__name__)
app.config["SECRET_KEY"] = "asdasdasdasdsadasd"
CORS(app, origins=["https://www.youtube.com"])
socketio = SocketIO(app, cors_allowed_origins="*")
load_dotenv(find_dotenv())
embeddings = OpenAIEmbeddings()


def create_db_from_video_url(video_url):
    loader = YoutubeLoader.from_youtube_url(video_url)
    transcript = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs = text_splitter.split_documents(transcript)

    db = FAISS.from_documents(docs, embeddings)
    return db


def get_response_from_query(db, query, k=4):
    docs = db.similarity_search(query, k=k)
    docs_page_content = " ".join([d.page_content for d in docs])

    chat = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.3)

    # Template to use for the system message prompt
    template = """
        You are a helpsul assistant that can answer question about youtube videos based in the video's transcript: {docs}

        Only use factual information from the transcript to answer the question.

        If you feel like you don't have enough information to answer, say "I don't know" and use your own knowledge to answer the question correctly and factual.

        Your answers should be verbose and detailed and truthful.
    """

    system_message_prompt = SystemMessagePromptTemplate.from_template(template)

    # Human question prompt
    human_template = "Answer the following question: {question}"
    human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)

    chat_prompt = ChatPromptTemplate.from_messages(
        [system_message_prompt, human_message_prompt]
    )

    chain = LLMChain(llm=chat, prompt=chat_prompt)

    response = chain.run(question=query, docs=docs_page_content)
    return response, docs


# A dictionary to store cached results per session
cached_results = {}


@socketio.on("send_message")
def handle_send_message(data):
    session_id = request.sid
    query = data.get("message")
    url = data.get("url")
    # Process the received message and URL

    # Check if the result is already cached for the current session
    if session_id not in cached_results:  # maybe replace session id with youtube url?
        print("STORE IN CACHE")
        db = create_db_from_video_url(url)
        cached_results[session_id] = db
    else:
        print("HIT FROM CACHE")
        db = cached_results[session_id]

    response, docs = get_response_from_query(db, query)

    # Send response
    emit("message_response", {"response": response})


if __name__ == "__main__":
    socketio.run(app, host="localhost", port=9000, allow_unsafe_werkzeug=True)
