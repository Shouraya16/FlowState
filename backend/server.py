from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt

app = Flask(__name__)
CORS(app)

users = []

@app.route("/")
def home():
    return "FlowState API Running"

@app.route("/signup", methods=["POST"])
def signup():

    data = request.json

    users.append(data)

    return jsonify({"message":"User created"})


@app.route("/login", methods=["POST"])
def login():

    data = request.json

    for u in users:
        if u["email"] == data["email"] and u["password"] == data["password"]:

            token = jwt.encode({"email":u["email"]},"secret",algorithm="HS256")

            return jsonify({"token":token})

    return jsonify({"error":"Invalid credentials"}),401


app.run(port=5000)