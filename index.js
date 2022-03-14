import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

const app = express();
const httpServer = createServer(app);

app.use(express.urlencoded({ extended: true }));

const cleSecrete = process.env.SECRET;

// Déclaration de la base de données Mongo:
const dataBase = {
  url: process.env.URL,
  dbName: process.env.DB,
  dbCol: process.env.COLLECTION,
};

const mongoClient = new MongoClient(dataBase.url);

// Déclaration des dossiers de fichiers statiques:
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

app.set('view engine', 'pug');

app.use(cors());
app.use(cookieParser());

app.use('/images', express.static(path.join(dirname, 'public', 'images')));
app.use('/css', express.static(path.join(dirname, 'public', 'css')));
app.use('/fonts', express.static(path.join(dirname, 'public', 'fonts')));
app.set('/views', express.static(path.join(dirname, '/views')));
app.use('/js', express.static(path.join(dirname, 'public', 'js')));

///////////////////////////////////////////////////////////////////////////
///////////////////////////// SERVEUR EXPRESS /////////////////////////////
///////////////////////////////////////////////////////////////////////////
const PORT = process.env.PORT;
const server = httpServer.listen(PORT, () => {
  console.log(`Le serveur est démarré sur le port ${server.address().port}`);
});
///////////////////////////////////////////////////////////////////////////
///////////////////////////// VARIABLES DE JEU ////////////////////////////
///////////////////////////////////////////////////////////////////////////

const game = {
  joueursConnexionEnCours: {},
  joueursConnectes: {},
  allRooms: [],
  couleurs: ['red', 'blue', 'green', 'yellow'],
  allAvatars: [
    '/images/ver.jpg',
    '/images/koala.png',
    '/images/vache.png',
    '/images/singe.png',
    '/images/perroquet.png',
    '/images/girafe.png',
    '/images/mouton.png',
    '/images/poule.png',
    '/images/cafard.png',
    '/images/mouche.png',
  ],
};

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// ACCUEIL /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

app.get('/', (req, res) => {
  res.render('template.pug', {
    login: true,
    signin: false,
    errorLogin: false,
    emptyInput: false,
    logged: false,
  });
});
///////////////////////////////////////////////////////////////////////////
/////////////////////////////// DECONNEXION ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

app.post('/logout', (req, res) => {
  delete game.joueursConnexionEnCours[req.cookies.id];
  res.redirect('/');
});

///////////////////////////////////////////////////////////////////////////
//////////////////////////////// CONNEXION ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

app.post('/login', (req, res, next) => {
  const userName = req.body.identifiant;
  const userPwd = req.body.password;
  if (userName == '' || userPwd == '') {
    res.render('template.pug', {
      login: true,
      signin: false,
      errorLogin: false,
      emptyInput: true,
      messageInformation: '',
    });
  } else {
    mongoClient.connect((err, client) => {
      const db = client.db(dataBase.dbName);
      const collection = db.collection(dataBase.dbCol);
      collection.findOne(
        {
          pseudo: userName,
          password: userPwd,
        },
        (err, data) => {
          // Cas d'erreur ou utilisateur inconnu
          if (null == data) {
            res.render('template.pug', {
              login: true,
              signin: false,
              errorLogin: true,
              messageInformation: '',
            });
          } else {
            // Cas de l'utilisateur inscrit avec login OK
            if (testConnexion(game.joueursConnectes, userName)) {
              const player = {
                pseudo: data.pseudo,
                id: uuidv4(),
                score: 0,
                avatar: choixAvatar(),
                best_score: data.best_score,
                jeuEnCours: false,
                decoSauvage: false,
              };
              player.token = creationToken(player.pseudo, player.id);
              game.joueursConnexionEnCours[player.id] = player;

              res
                .cookie('token', player.token)
                .cookie('pseudo', player.pseudo)
                .cookie('id', player.id)
                .cookie('best_score', player.best_score)
                .cookie('score', player.score)
                .cookie('avatar', player.avatar)
                .cookie('jeuEnCours', player.jeuEnCours)
                .cookie('decoSauvage', player.decoSauvage)
                .redirect('/auth/game');
            } else {
              // Cas de la double connexion
              res.render('template.pug', {
                login: true,
                signin: false,
                errorLogin: false,
                emptyInput: false,
                logged: true,
                messageInformation: `Vous êtes déjà connecté  ${userName} !!`,
              });
            }
          }
        }
      );
      client.close;
    });
  }
});

///////////////////////////////////////////////////////////////////////////
/////////////////////////////// INSCRIPTION ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

app.get('/signin', (req, res) => {
  res.render('template.pug', {
    login: false,
    signin: true,
    errorLogin: false,
    emptyInput: false,
  });
});

app.post('/signin', (req, res) => {
  const userName = req.body.identifiant;
  const userPwd = req.body.password;
  if (userName == '' || userPwd == '') {
    res.render('template.pug', {
      login: false,
      signin: true,
      errorLogin: false,
      emptyInput: true,
      messageInformation: '',
    });
  } else {
    // On fouille dans la db pour voir si le user n'est pas déjà existant
    mongoClient.connect((err, client) => {
      const db = client.db(dataBase.dbName);
      const collection = db.collection(dataBase.dbCol);
      collection.findOne(
        {
          pseudo: userName,
        },
        (err, data) => {
          // L'utilisateur est inconnu, on peut l'inscrire
          if (null == data) {
            const player = {
              pseudo: userName,
              password: userPwd,
              id: uuidv4(),
              avatar: choixAvatar(),
              score: 0,
              best_score: 0,
              jeuEnCours: false,
              decoSauvage: false,
            };
            collection.insertOne(player);
            player.token = creationToken(player.pseudo, player.id);
            game.joueursConnexionEnCours[player.id] = player;
            res
              .cookie('token', player.token)
              .cookie('pseudo', player.pseudo)
              .cookie('id', player.id)
              .cookie('best_score', player.best_score)
              .cookie('score', player.score)
              .cookie('avatar', player.avatar)
              .cookie('jeuEnCours', player.jeuEnCours)
              .cookie('decoSauvage', player.decoSauvage)
              .redirect('auth/game');
          } else {
            // Cas de l'utiiisateur déjà inscrit
            res.render('template.pug', {
              login: false,
              signin: true,
              errorLogin: true,
              emptyInput: false,
              logged: false,
              messageInformation: `Vous êtes déjà inscrit  ${userName} !!`,
            });
          }
        }
      );
      client.close;
    });
  }
});

app.get('/auth/*', (req, res, next) => {
  // On redirige vers l'accueil toute tentative de connexion en direct au jeu via l'url:
  if (
    game.joueursConnexionEnCours[req.cookies.id] === undefined &&
    !game.joueursConnectes[req.cookies.id]
  ) {
    res.redirect('/');
  } else {
    try {
      jwt.verify(req.cookies.token, cleSecrete);
      next();
    } catch (error) {
      res.render('/404.pug');
    }
  }
});

app.get('/auth/game', (req, res) => {
  // On charge la liste des meilleurs scores:
  try {
    mongoClient.connect((err, client) => {
      const db = client.db(dataBase.dbName);
      const collection = db.collection(dataBase.dbCol);

      collection
        .find()
        .sort({
          best_score: -1,
        })
        .limit(10)
        .toArray((err, data) => {
          res.render('jeu.pug', {
            login: true,
            signin: false,
            errorLogin: false,
            emptyInput: false,
            logged: true,
            best_scores: data,
            messageInformation: `Bienvenue ${req.cookies.pseudo} !!`,
          });
        });
      client.close;
    });
  } catch (error) {
    console.error(error);
  }
});

///////////////////////////////////////////////////////////////////////////
//////////////////////////// SERVEUR SOCKET IO ////////////////////////////
///////////////////////////////////////////////////////////////////////////
const io = new Server(httpServer);

const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
};

io.on('connection', (socket) => {
  console.log('connecté au serveur io');

  const headers = socket.request.rawHeaders;
  const cookies = headers[1 + headers.indexOf('Cookie')].split('; ');

  const objCookie = {};
  for (let i = 0; i < cookies.length; i++) {
    const property = cookies[i].split('=');
    switch (property[0]) {
      case 'pseudo':
        objCookie.pseudo = property[1];
        break;
      case 'id':
        objCookie.id = property[1];
        break;
      case 'token':
        objCookie.token = property[1];
        break;
      case 'best_score':
        objCookie.best_score = property[1];
        break;
      case 'score':
        objCookie.score = parseFloat(property[1]);
        break;
      case 'avatar':
        objCookie.avatar = property[1];
        break;
      case 'jeuEnCours':
        objCookie.jeuEnCours = property[1];
        break;
      case 'decoSauvage':
        objCookie.decoSauvage = property[1];
        break;
    }
  }

  delete game.joueursConnexionEnCours[objCookie.id];

  game.joueursConnectes[socket.id] = objCookie;
  game.joueursConnectes[socket.id].idSocket = socket.id;

  socket.on('goRoom', () => {
    let room = null;
    game.joueursConnectes[socket.id].jeuEnCours = true;
    game.joueursConnectes[socket.id].decoSauvage = false;

    // si il n'y a pas de room créée:
    // on en créé une
    if (game.allRooms.length === 0) {
      room = creationRoom(game.joueursConnectes[socket.id]);
      socket.join(room.id);
      return;
    } else {
      // Sinon si une room existe
      const nbRoom = game.allRooms.length;
      const nbJoueursRoom = game.allRooms[nbRoom - 1].joueurs.length;
      // si le nombre de joueur dans la dernière room est différent de 2
      if (nbJoueursRoom != 2) {
        room = game.allRooms[nbRoom - 1];
        game.joueursConnectes[socket.id].idRoom = room.id;
        room.joueurs.push(game.joueursConnectes[socket.id]);
        socket.join(room.id);
      } else {
        // si le nombre de joueur dans la dernière room est de 2 (salle pleine)
        room = creationRoom(game.joueursConnectes[socket.id]);
        socket.join(room.id);
      }
    }

    if (room.joueurs.length === 2) {
      io.to(room.joueurs[0].idSocket).emit(
        'init_label_joueurs',
        room.joueurs[0].pseudo,
        room.joueurs[0].avatar,
        room.joueurs[1].pseudo,
        room.joueurs[1].avatar
      );
      io.to(room.joueurs[1].idSocket).emit(
        'init_label_joueurs',
        room.joueurs[1].pseudo,
        room.joueurs[1].avatar,
        room.joueurs[0].pseudo,
        room.joueurs[0].avatar
      );

      io.to(room.id).emit('init_game', definirLesCarres(), room);
      io.to(room.id).emit('start_game', room);

      socket.on('start_chrono', () => {
        let compteur = 19;
        let chrono = setInterval(() => {
          io.to(room.id).emit('maj_chrono', compteur);

          if (compteur === 0) {
            const podium = checkScore(room);

            io.to(room.id).emit('fin_de_partie', podium[0], podium[1], false);
            clearInterval(chrono);
          }
          compteur--;
        }, 1000);
      });
    }
  });

  socket.on('clic_carre', (carre, salon) => {
    if (carre.class === 'clickable') {
      // On met à jour les scores:
      const gain = checkgame(carre.couleur, carre.cible);
      salon = majScores(salon, socket.id, gain);

      io.to(salon.joueurs[0].idSocket).emit(
        'maj_scores',
        salon.joueurs[0].score,
        salon.joueurs[1].score
      );
      io.to(salon.joueurs[1].idSocket).emit(
        'maj_scores',
        salon.joueurs[1].score,
        salon.joueurs[0].score
      );

      // On supprime le carré:
      io.to(salon.id).emit('suppression_carre', carre.id, salon);
    }
  });

  socket.on('disconnecting', () => {
    const salon = Array.from(socket.rooms);

    if (game.joueursConnectes[salon[0]].jeuEnCours) {
      delete game.joueursConnectes[salon[0]];
    }

    io.to(salon[1]).emit('fin_de_partie', null, null, true);

    delete socket.request.headers.cookie;
  });
});

///////////////////////////////////////////////////////////////////////////
//////////////////////////////// FONCTIONS ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

const creationRoom = (joueur) => {
  joueur.idRoom = uuidv4();
  const room = { id: joueur.idRoom, joueurs: [] };
  room.joueurs.push(joueur);
  game.allRooms.push(room);
  return room;
};

const definirLesCarres = () => {
  const listeDeDivs = {};
  const objInfos = {
    nbCarres: 200,
    couleurCible: game.couleurs[getRandomInt(game.couleurs.length)],
    carresADessiner: [],
    avatar: '/images/' + game.allAvatars[getRandomInt(game.allAvatars.length)],
  };

  for (let i = 1; i < objInfos.nbCarres + 1; i++) {
    const newId = uuidv4();
    const div = {
      id: newId,
      color: game.couleurs[getRandomInt(game.couleurs.length)],
      position: 'absolute',
      width: 1 + getRandomInt(10) + 'rem',
      left: 5 + getRandomInt(80) + '%',
      top: getRandomInt(76) + '%',
      rotate: getRandomInt(360) + 'deg',
      border: '3px solid black',
    };
    objInfos.carresADessiner.push(div);
    listeDeDivs[newId] = div;
  }
  return objInfos;
};

const checkgame = (couleur, cible) => {
  if (couleur === cible) {
    return 5;
  } else {
    return -2;
  }
};
const majScores = (salon, socketid, points) => {
  if (salon.joueurs[0].idSocket === socketid) {
    salon.joueurs[0].score = salon.joueurs[0].score + points;
  } else {
    salon.joueurs[1].score = salon.joueurs[1].score + points;
  }
  game.joueursConnectes[socketid].score =
    game.joueursConnectes[socketid].score + points;
  return salon;
};

const choixAvatar = () => {
  return game.allAvatars[getRandomInt(game.allAvatars.length - 1)];
};

const checkScore = (room) => {
  majBestScore(room.joueurs[0]);
  majBestScore(room.joueurs[1]);
  if (room.joueurs[0].score === room.joueurs[1].score) {
    room.joueurs[0].avatar = '/images/coeur.png';
    return [room.joueurs[0], room.joueurs[0]];
  } else {
    if (room.joueurs[0].score > room.joueurs[1].score) {
      return [room.joueurs[0], room.joueurs[1]];
    } else {
      return [room.joueurs[1], room.joueurs[0]];
    }
  }
};
const majBestScore = (joueur) => {
  if (joueur.score > joueur.best_score) {
    try {
      mongoClient.connect((err, client) => {
        const db = client.db(dataBase.dbName);
        const collection = db.collection(dataBase.dbCol);

        collection.updateOne(
          { pseudo: joueur.pseudo },
          { $set: { best_score: joueur.score } }
        );
        client.close;
      });
    } catch (error) {
      console.error(error);
    }
  }
};

const creationToken = (userName, id) => {
  return jwt.sign({ userToken: userName, idToken: id }, cleSecrete);
};

const testConnexion = (liste, pseudo) => {
  for (const player in liste) {
    if (liste[player].pseudo === pseudo) {
      return false;
    }
  }
  return true;
};
///////////////////////////////////////////////////////////////////////////
//////////////////////////////// ERREUR 404 ///////////////////////////////
///////////////////////////////////////////////////////////////////////////
app.use(function (req, res) {
  res.status(404).render('404.pug');
});
