# 1 - Cloner le projet.

```
git clone https://github.com/Lidobix/squareit.git
```

# 2 - Installation des paquets npm.

```
npm install
```

(pug, express, session-file-store, websocket, socket.io, socket.io-client, jsonwebtoken, uuid, mongodb , cookie-parser, dotenv)

# 3 - Installation de la base de données.

Fichier export de la base de données: db.json

Dans le ficher .env, compléter la variable URL avec le lien vers la db locale:

```
#DB
URL='<lien MongoCompass vers le fichier db.json>'
DB='squareit'
COLLECTION='players'
```

# 4 - Démarrage de l'application.

```
npm start
```

Application disponible en local sur le port 8100.

# 5 - Have fun!
