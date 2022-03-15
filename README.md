# 1 - Cloner le projet.

```
git clone https://github.com/Lidobix/sqware-it_local.git
```

# 2 - Installation des paquets npm.

```
npm install
```

paquets intégrés: pug, express, session-file-store, websocket, socket.io, socket.io-client, jsonwebtoken, uuid, mongodb , cookie-parser, dotenv.

# 3 - Installation de la base de données.

Sous Mongo en local:

Créez une base de données nommée "sqware-it"
Y ajouter une collection "players"
Importez dans cette collection le fichier export de la base de données: db.json

Dans le ficher .env, compléter la variable URL avec le lien vers la db locale et sauvegardez:

```
#DB
URL='<lien MongoCompass vers le fichier db.json>'
DB='sqware-it'
COLLECTION='players'
```

# 4 - Démarrage de l'application.

```
npm start
```

L'application est disponible en local: http://localhost:8100/

# 5 - Have fun!
