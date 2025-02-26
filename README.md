# Script de Suppression Sélective de Messages Messenger

Ce script permet de **supprimer uniquement vos messages** (et non ceux de l’autre personne) dans vos conversations Facebook Messenger. Il fonctionne en **cliquant automatiquement** sur les boutons « Plus », « Supprimer » et en **validant** la pop-up de confirmation. Il gère également le **bouton radio** (value="1") avant la confirmation finale, si nécessaire.

## Fonctionnalités principales

1. **Filtrage des messages** :  
   Le script recherche dans chaque message un texte du type **« Vous: »** ou **« Vous avez envoyé »** (en minuscules) pour déterminer si ce message vous appartient.  
2. **Double clic « Supprimer »** :  
   - Premier clic : menu « Plus » → « Supprimer » (ou « Retirer »)  
   - Deuxième clic : bouton « Supprimer » dans la pop-up de confirmation  
3. **Sélection du bouton radio** (value="1") avant la confirmation finale, si vous le souhaitez.  
4. **Boucle sur toutes les conversations** :  
   - Peut ouvrir chaque conversation (liste sur la gauche),  
   - Supprimer **uniquement vos messages** dans chacune,  
   - Revenir ensuite à la liste (selon votre interface, si nécessaire).

## Pré-requis

- **Navigateur** : Chrome, Firefox, ou tout autre navigateur avec outil de développement (DevTools).  
- **Accès à Facebook Messenger** : vous devez être **connecté** à votre compte Facebook/Messenger.

## Mode d’emploi

1. **Ouvrez Facebook Messenger** dans votre navigateur.  
2. **Ouvrez la console** :  
   - Chrome (Windows/Linux) : F12 ou Ctrl+Maj+J  
   - Firefox (Windows/Linux) : F12 ou Ctrl+Maj+K  
   - Mac : Cmd+Option+J (Chrome) ou Cmd+Option+K (Firefox)  
3. **Copiez-collez** le script (voir plus bas) dans la console et appuyez sur **Entrée**.  
4. **Lancez** la fonction souhaitée :  
   - Pour **toutes** les conversations :  
     ```js
     deleteAllMyMessagesInAllConversations();
     ```
   - Pour **Seulement** la conversations ouverte :
    ```js
     deleteMyMessagesInCurrentConversation();
    ```
    
5. **Ne touchez plus la souris** pendant l’exécution : le script va cliquer automatiquement sur les éléments nécessaires.  
6. **Surveillez la console** : vous verrez le nombre de messages, les passages successifs, etc.

## Le script complet

```js
// @Say
/******************************************************
 * (A) Petite fonction utilitaire pour marquer une pause
 ******************************************************/
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/******************************************************
 * (B) Scroller la LISTE DE CONVERSATIONS (colonne de gauche)
 *     pour tout charger
 ******************************************************/
async function loadAllConversations() {
  console.log("=== (B) CHARGEMENT DE TOUTES LES CONVERSATIONS (LISTE GAUCHE) ===");

  // 1) Sélection du conteneur de la liste de conversations (colonne de gauche)
  let conversationList = document.querySelector("div[aria-label='Discussions'][role='grid']");
  if (!conversationList) {
    console.error("Impossible de trouver la liste de conversations (colonne gauche).");
    return [];
  }

  // 2) Scroll vers le bas en boucle, jusqu'à ce que plus rien ne charge
  let lastScrollHeight = 0;
  let stableTime = 0;

  while (true) {
    conversationList.scrollTo(0, conversationList.scrollHeight);
    await delay(500);

    if (conversationList.scrollHeight === lastScrollHeight) {
      stableTime += 500;
    } else {
      stableTime = 0;
    }

    if (stableTime >= 3000) {
      // 3 secondes sans changement => on arrête
      break;
    }
    lastScrollHeight = conversationList.scrollHeight;
  }

  // 3) Récupérer tous les liens <a> de conversations
  let convLinks = conversationList.querySelectorAll("a[href^='/messages/t/']");
  console.log("Nombre de conversations chargées :", convLinks.length);

  return Array.from(convLinks);
}

/******************************************************
 * (C) Scroller la CONVERSATION (colonne de droite)
 *     pour charger tous les messages
 ******************************************************/
async function loadAllMessagesInConversation() {
  console.log("=== (C) CHARGEMENT DE TOUS LES MESSAGES (FENÊTRE DROITE) ===");

  // 1) Sélection du conteneur de la fenêtre de conversation (colonne de droite)
  let conversationWindow = document.querySelector("div[aria-label^='Messages dans la conversation']");
  if (!conversationWindow) {
    console.error("Impossible de trouver la fenêtre de conversation (colonne de droite).");
    return;
  }

  // 2) Scroll vers le haut en boucle, jusqu'à ce que plus rien ne charge
  let lastScrollTop = conversationWindow.scrollTop;
  let stableTime = 0;

  while (true) {
    // On scrolle vers le haut
    conversationWindow.scrollTo(0, 0);
    await delay(500);

    if (conversationWindow.scrollTop === lastScrollTop) {
      stableTime += 500;
    } else {
      stableTime = 0;
    }

    if (stableTime >= 3000) {
      // 3 secondes sans changement => on arrête
      break;
    }
    lastScrollTop = conversationWindow.scrollTop;
  }

  console.log("Fin du chargement des messages dans la conversation.");
}

/******************************************************
 * (D) Supprimer uniquement VOS messages
 *     dans la conversation actuelle (colonne de droite)
 ******************************************************/
async function deleteMyMessagesInCurrentConversation() {
  console.log("=== (D) SUPPRESSION DE VOS MESSAGES DANS LA CONVERSATION ACTUELLE ===");

  // 1) Récupérer le conteneur (colonne de droite)
  let conversationWindow = document.querySelector("div[aria-label^='Messages dans la conversation']");
  if (!conversationWindow) {
    console.error("Impossible de trouver la fenêtre de conversation.");
    return;
  }

  let iteration = 0;
  while (true) {
    iteration++;
    if (iteration > 15) {
      console.log("Trop de boucles, on arrête pour éviter une boucle infinie.");
      break;
    }

    // 2) Sélectionner tous les messages dans la fenêtre
    //    (Ici, par ex. "div.__fb-light-mode[role='row']")
    //    Ajustez si nécessaire selon votre DOM
    let messages = conversationWindow.querySelectorAll("div.__fb-light-mode[role='row']");
    if (messages.length === 0) {
      console.log("Plus aucun message, conversation vide ou rien à supprimer.");
      break;
    }

    console.log(`Passage n°${iteration}, nombre de messages = ${messages.length}`);
    let anyDeleted = false;

    // 3) Parcourir du bas vers le haut (pour éviter des reflows)
    for (let i = messages.length - 1; i >= 0; i--) {
      let message = messages[i];

      // a) Vérifier si c'est un message qui VOUS appartient
      //    Ex. si "Vous avez envoyé" ou "Vous:" dans le texte
      let txt = (message.innerText || "").toLowerCase();
      if (!txt.includes("vous avez envoyé") && !txt.includes("vous:")) {
        continue;
      }

      // b) Survoler le message pour faire apparaître le bouton "Plus" (aria-label="Plus")
      message.dispatchEvent(new MouseEvent("mouseover", {
        view: window,
        bubbles: true,
        cancelable: true
      }));
      await delay(200);

      // c) Cliquer sur le bouton "Plus"
      let plusButton = message.querySelector("div[aria-label='Plus']");
      if (!plusButton) {
        continue;
      }
      plusButton.click();
      await delay(300);

      // d) Dans le menu qui apparaît, chercher "Supprimer" ou "Retirer"
      let menuItems = document.querySelectorAll("div[role='menuitem']");
      let deleteBtn = null;
      menuItems.forEach(item => {
        let t = (item.innerText || "").toLowerCase();
        if (t.includes("supprimer") || t.includes("retirer")) {
          deleteBtn = item;
        }
      });
      if (!deleteBtn) {
        continue;
      }
      deleteBtn.click();
      await delay(500);

      // e) Messenger demande parfois de choisir "supprimer pour vous" vs "supprimer pour tout le monde"
      //    => On coche "supprimer pour tout le monde" (value="1") ou autre
      let secondRadio = document.querySelector('input[type="radio"][value="1"]');
      if (secondRadio) {
        secondRadio.click();
        await delay(200);
      }

      // f) Bouton "Supprimer" final dans la pop-up
      let secondDeleteBtn = Array.from(document.querySelectorAll("div[aria-label='Supprimer']"))
        .find(btn => !btn.hasAttribute("aria-disabled"));
      if (secondDeleteBtn) {
        secondDeleteBtn.click();
        anyDeleted = true;
        await delay(500);
      }
    }

    if (!anyDeleted) {
      console.log("Aucun message supprimé lors de ce passage, on arrête.");
      break;
    }
    // Petite pause avant de retenter un nouveau passage
    await delay(1000);
  }
}

/******************************************************
 * (E) Tout enchaîner : supprimer VOS messages dans TOUTES les conv
 ******************************************************/
async function deleteAllMyMessagesInAllConversations() {
  console.log("=== (E) SUPPRIMER VOS MESSAGES DANS TOUTES LES CONVERSATIONS ===");

  // 1) Charger la liste de conversations (colonne gauche)
  let convLinks = await loadAllConversations();
  console.log("Liste des conversations trouvées :", convLinks.length);

  // 2) Parcourir chaque conversation
  for (let i = 0; i < convLinks.length; i++) {
    let link = convLinks[i];
    console.log(`\n--- Conversation n°${i + 1}/${convLinks.length} : on clique sur`, link.href);

    // a) Cliquer sur la conversation pour l’ouvrir (colonne de droite)
    link.click();

    // b) Attendre un peu le chargement
    await delay(2000);

    // c) Scroller tous les messages (colonne de droite)
    await loadAllMessagesInConversation();

    // d) Supprimer vos messages
    await deleteMyMessagesInCurrentConversation();

    // e) Retour à la liste de conversations
    //    => Messenger recharge parfois la liste => re-sélection
    convLinks = await loadAllConversations();
    if (i + 1 >= convLinks.length) {
      console.log("Plus de conversation suivante, on arrête la boucle.");
      break;
    }
  }

  console.log("Terminé : toutes les conversations ont été traitées.");
}

