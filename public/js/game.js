window.document.addEventListener('DOMContentLoaded', () => {
  const socket = io('http://localhost:8100');

  const infoCouleurCible = window.document.getElementById('couleurCible');
  let couleurCible;
  let roomFront = [];
  let carresPresents = [];
  const gameZone = window.document.getElementById('gameZone');
  const btnPlay = window.document.getElementById('bouton_play');
  const infosJeu = window.document.getElementById('infosJeu');
  const regleDuJeu = window.document.getElementById('regleDuJeu');
  const nouvellePartie = window.document.getElementById('nouvellePartie');
  const attenteJoueur = window.document.getElementById('attenteJoueur');
  const bestScores = window.document.getElementById('bestScores');
  const avatarHaut = window.document.getElementById('avatar1');
  const avatarBas = window.document.getElementById('avatar2');
  const userHaut = window.document.getElementById('user1');
  const userBas = window.document.getElementById('user2');
  const scoreHaut = window.document.getElementById('score1');
  const scoreBas = window.document.getElementById('score2');
  const timer = window.document.getElementById('timer');
  const endWindow = window.document.getElementById('endWindow');
  const avatarWin = window.document.getElementById('avatarWin');
  const windScore = window.document.getElementById('scores');
  const scoreWinner = window.document.getElementById('winner');
  const scoreLooser = window.document.getElementById('looser');

  btnPlay.addEventListener('click', () => {
    socket.emit('goRoom');
    btnPlay.style.display = 'none';
    attenteJoueur.style.display = 'inline';
  });

  const creationCarres = (carresADessiner) => {
    carresADessiner.forEach((carre) => {
      let divCliquable = window.document.createElement('div');
      gameZone.appendChild(divCliquable);
      divCliquable.classList.add('clickable');
      divCliquable.id = carre.id;
      divCliquable.style.position = carre.position;
      divCliquable.style.width = carre.width;
      divCliquable.style.height = carre.width;
      divCliquable.style.top = carre.top;
      divCliquable.style.left = carre.left;
      divCliquable.style.backgroundColor = carre.color;
      divCliquable.style.transform = `rotate(${carre.rotate}`;
      divCliquable.style.border = carre.border;
      carresPresents.push(carre.id);
    });
  };

  const suppression_carre = (idCarre) => {
    const carre = window.document.getElementById(idCarre);
    gameZone.removeChild(carre);
    carresPresents.splice(carresPresents.indexOf(idCarre), 1);
  };

  const convertPath = (path) => {
    return path.replace(/%2F/g, '/');
  };
  socket.on(
    'init_label_joueurs',
    (pseudoJoueurHaut, avatarJoueurHaut, pseudoJoueurBas, avatarJoueurBas) => {
      avatarHaut.src = convertPath(avatarJoueurHaut);
      userHaut.innerText = pseudoJoueurHaut;
      avatarBas.src = convertPath(avatarJoueurBas);
      userBas.innerText = pseudoJoueurBas;
    }
  );

  socket.on('init_game', (infos) => {
    gameZone.classList.remove('masque');
    gameZone.classList.add('visible');

    creationCarres(infos.carresADessiner);

    couleurCible = infos.couleurCible;
    infoCouleurCible.style.backgroundColor = infos.couleurCible;
  });

  socket.on('start_game', (room) => {
    roomFront = room;

    bestScores.style.display = 'none';
    infosJeu.style.display = 'block';
    regleDuJeu.style.display = 'none';
    nouvellePartie.style.display = 'none';

    socket.emit('start_chrono', roomFront);

    gameZone.addEventListener('click', (event) => {
      const caractCarreClique = {
        id: event.target.id,
        couleur: event.target.style.backgroundColor,
        class: event.target.className,
        cible: couleurCible,
      };

      socket.emit('clic_carre', caractCarreClique, roomFront);
    });
  });

  socket.on('suppression_carre', (idCarre, room) => {
    roomFront = room;
    suppression_carre(idCarre);
  });

  socket.on('maj_scores', (scoreJoueurHaut, scoreJoueurBas) => {
    scoreHaut.innerText = scoreJoueurHaut + ' Pts';
    scoreBas.innerText = scoreJoueurBas + ' Pts';
  });

  socket.on('maj_chrono', (chrono) => {
    timer.innerText = `${chrono}s`;
  });

  socket.on('fin_de_partie', (winner, looser, deco) => {
    for (let i = 0; i < carresPresents.length; i++) {
      const divAsupprimer = window.document.getElementById(carresPresents[i]);
      gameZone.removeChild(divAsupprimer);
    }

    if (deco) {
      scoreWinner.innerText = `Votre adversaire est parti sqwarer ailleurs...\nLa victoire est à vous !`;
    } else {
      if (winner.score === looser.score) {
        scoreWinner.innerText = `Match nul ! ! ! ${winner.score} partout ! ! !`;
        windScore.removeChild(scoreLooser);
      } else {
        scoreWinner.innerText = `${winner.pseudo} gagne avec ${winner.score}pts ! ! !`;
        scoreLooser.innerText = `${looser.pseudo} . . . . ${looser.score}pts . . .`;
      }

      avatarWin.src = convertPath(winner.avatar);
    }
    endWindow.style.display = 'flex';
  });

  socket.on('deco_sauvage', (message) => {
    alert(message);
  });
});
