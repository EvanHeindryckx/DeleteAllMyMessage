// @Say

/******************************************************
 * (A) Petite fonction utilitaire pour marquer une pause
 ******************************************************/
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/******************************************************
 * (B) Scroller la liste de conversations pour tout charger
 *     sans quitter la page.
 ******************************************************/
async function loadAllConversationsSPA() {
  console.log("Chargement de toutes les conversations (SPA)...");
  
  // Hypothèse : la liste de conversations est un <div aria-label="Discussions" role="grid">
  let conversationList = document.querySelector("div[aria-label='Discussions'][role='grid']");
  if (!conversationList) {
    console.error("Impossible de trouver la liste de conversations.");
    return [];
  }

  let lastScrollHeight = 0;
  let stableTime = 0;

  // On scrolle vers le bas en boucle, jusqu'à ce que ça ne charge plus
  while (true) {
    conversationList.scrollTo(0, conversationList.scrollHeight);
    await delay(500);

    if (conversationList.scrollHeight === lastScrollHeight) {
      stableTime += 500;
    } else {
      stableTime = 0;
    }
    if (stableTime >= 3000) {
      // 3 secondes sans changement -> on arrête
      break;
    }
    lastScrollHeight = conversationList.scrollHeight;
  }

  // Maintenant, on récupère tous les éléments qui représentent une conversation
  // Exemple : <a href="/messages/t/12345"> ou <div data-testid="mwthreadlist-item">...
  // Ici, on suppose un <a> avec href commençant par "/messages/t/"
  let convLinks = conversationList.querySelectorAll("a[href^='/messages/t/']");
  console.log("Nombre de conversations chargées :", convLinks.length);

  // On retourne un tableau (ou NodeList) de ces éléments
  return Array.from(convLinks);
}

/******************************************************
 * (C) Scroller la conversation pour charger tous les messages
 *     en restant sur la même page (scrollTop = 0).
 ******************************************************/
async function loadAllMessagesSPA() {
  console.log("Chargement de tous les messages de cette conversation (SPA)...");

  // Hypothèse : le conteneur de la conversation est un <div aria-label="Discussions" role="grid">
  // (souvent le même que pour la liste, mais la partie "droite" du DOM est parfois distincte)
  // Adaptez selon votre DOM réel (ex. "div[role='log']", etc.)
  let conversationWindow = document.querySelector("div[aria-label='Discussions'][role='grid']");
  if (!conversationWindow) {
    console.error("Impossible de trouver la fenêtre de conversation.");
    return;
  }

  let lastScrollTop = conversationWindow.scrollTop;
  let stableTime = 0;

  // On scrolle vers le haut en boucle
  while (true) {
    conversationWindow.scrollTo(0, 0);
    await delay(500);

    if (conversationWindow.scrollTop === lastScrollTop) {
      stableTime += 500;
    } else {
      stableTime = 0;
    }
    if (stableTime >= 3000) {
      break;
    }
    lastScrollTop = conversationWindow.scrollTop;
  }
  console.log("Fin du chargement des messages (SPA).");
}

/******************************************************
 * (D) Supprimer uniquement VOS messages
 *     (filtrage sur "Vous:" / "Vous avez envoyé")
 *     en restant sur la même page.
 ******************************************************/
async function deleteMyMessagesInCurrentConversation() {
  let iteration = 0;
  while (true) {
    iteration++;
    if (iteration > 15) {
      console.log("Trop de boucles, on arrête pour éviter une boucle infinie.");
      break;
    }

    let messages = document.querySelectorAll("div.__fb-light-mode[role='row']");
    if (messages.length === 0) {
      console.log("Plus aucun message, conversation vide.");
      break;
    }

    console.log(`Passage n°${iteration}, nombre de messages :`, messages.length);
    let anyDeleted = false;

    // Parcourir du bas vers le haut
    for (let i = messages.length - 1; i >= 0; i--) {
      let message = messages[i];

      // Vérifier si c'est un message qui VOUS appartient
      let txt = message.innerText.toLowerCase();
      if (!txt.includes("vous avez envoyé") && !txt.includes("vous:")) {
        continue;
      }

      // Survol pour faire apparaître le bouton "Plus"
      message.dispatchEvent(new MouseEvent("mouseover", {
        view: window,
        bubbles: true,
        cancelable: true
      }));
      await delay(100);

      // Bouton "Plus" (aria-label="Plus")
      let plusButton = message.querySelector("div[aria-label='Plus']");
      if (!plusButton) continue;
      plusButton.click();
      await delay(200);

      // Chercher "Supprimer" ou "Retirer"
      let menuItems = document.querySelectorAll("div[role='menuitem']");
      let firstDeleteBtn = null;
      menuItems.forEach(item => {
        let t = (item.innerText || "").toLowerCase();
        if (t.includes("supprimer") || t.includes("retirer")) {
          firstDeleteBtn = item;
        }
      });
      if (!firstDeleteBtn) continue;
      firstDeleteBtn.click();
      await delay(500);

      // Sélection du bouton radio (value="1")
      let secondRadio = document.querySelector('input[type="radio"][value="1"]');
      if (secondRadio) {
        secondRadio.click();
        await delay(200);
      }

      // Bouton "Supprimer" dans la pop-up
      let secondDeleteBtn = Array.from(document.querySelectorAll("div[aria-label='Supprimer']"))
        .find(btn => !btn.hasAttribute("aria-disabled"));
      if (secondDeleteBtn) {
        secondDeleteBtn.click();
        anyDeleted = true;
        await delay(300);
      }
    }

    if (!anyDeleted) {
      console.log("Aucun message supprimé lors de ce passage, on arrête.");
      break;
    }
    await delay(1000);
  }
}


/******************************************************
 * (E) Parcourir toutes les conversations dans la même page
 ******************************************************/
async function deleteAllMyMessagesInAllConversationsSPA() {
  // 1) Charger toutes les conversations (scroll)
  let convLinks = await loadAllConversationsSPA();
  console.log("Liste des conversations trouvées :", convLinks.length);

  // 2) Parcourir chaque conversation
  for (let i = 0; i < convLinks.length; i++) {
    let link = convLinks[i];
    console.log(`Conversation n°${i + 1} : on clique sur`, link);

    // (a) Cliquer sur la conversation pour l’ouvrir
    link.click();
    // (b) Attendre un peu
    await delay(2000);

    // (c) Charger tous les messages (scroll vers le haut)
    await loadAllMessagesSPA();

    // (d) Supprimer vos messages
    await deleteMyMessagesInCurrentConversation();

    // (e) Retrouver la liste de conversations dans le DOM
    //     car parfois Messenger reconstruit le DOM
    //     On retient le convLinks[i+1] qu’on doit cliquer
    //     Mais ce n’est plus le même objet DOM => On doit le re-sélectionner
    //     OU on retente "loadAllConversationsSPA()" pour tout recharger
    convLinks = await loadAllConversationsSPA();
    // S’il n’y a plus de conv ou si i+1 >= convLinks.length, on arrête la boucle
    if (i + 1 >= convLinks.length) break;
  }

  console.log("Terminé : toutes les conversations ont été traitées (SPA).");
}
