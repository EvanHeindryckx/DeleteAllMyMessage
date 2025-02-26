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
   
5. **Ne touchez plus la souris** pendant l’exécution : le script va cliquer automatiquement sur les éléments nécessaires.  
6. **Surveillez la console** : vous verrez le nombre de messages, les passages successifs, etc.

## Le script complet

```js
// @Say

// ----------------------------------------------------
// (1) Fonction utilitaire pour marquer une pause
// ----------------------------------------------------
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ----------------------------------------------------
// (2) Supprime tous VOS messages dans la conversation
//     en bouclant jusqu'à ce qu'il n'en reste plus.
//     - Détecte un message "à vous" via un texte "Vous:"
//       ou "Vous avez envoyé".
//     - Sélectionne le bouton radio (value="1") avant
//       le second clic sur "Supprimer".
// ----------------------------------------------------
async function deleteMyMessagesInCurrentConversation() {
  let iteration = 0;
  while (true) {
    iteration++;
    if (iteration > 15) {
      console.log("Trop de boucles, on arrête pour éviter une boucle infinie.");
      break;
    }

    // Récupérer tous les messages
    let messages = document.querySelectorAll("div.__fb-light-mode[role='row']");
    if (messages.length === 0) {
      console.log("Plus aucun message à supprimer, conversation vide.");
      break;
    }

    console.log(`Passage n°${iteration}, nombre de messages :`, messages.length);

    let anyDeleted = false; // Savoir si on a effectivement supprimé quelque chose

    // Parcourir les messages du bas vers le haut
    for (let i = messages.length - 1; i >= 0; i--) {
      let message = messages[i];

      // Vérifier si c'est un message qui VOUS appartient
      // On regarde tout le texte du message en minuscules
      let messageText = message.innerText.toLowerCase();

      // Filtrage simple : on cherche "vous avez envoyé" OU "vous:"
      // Ajustez si besoin (par ex. "me:", "you:", etc. en anglais).
      if (
        !messageText.includes("vous avez envoyé") &&
        !messageText.includes("vous:")
      ) {
        // Ce n'est pas votre message, on le saute
        continue;
      }

      // Survoler pour faire apparaître le bouton « Plus »
      message.dispatchEvent(new MouseEvent("mouseover", {
        view: window,
        bubbles: true,
        cancelable: true
      }));
      await delay(100);

      // Cliquer sur le bouton « Plus » (aria-label="Plus")
      let plusButton = message.querySelector("div[aria-label='Plus']");
      if (!plusButton) {
        continue;
      }
      plusButton.click();
      await delay(200);

      // Chercher l’option « Supprimer » ou « Retirer »
      let menuItems = document.querySelectorAll("div[role='menuitem']");
      let firstDeleteBtn = null;
      menuItems.forEach(item => {
        let text = (item.innerText || "").toLowerCase();
        if (text.includes("supprimer") || text.includes("retirer")) {
          firstDeleteBtn = item;
        }
      });
      if (!firstDeleteBtn) {
        continue;
      }
      firstDeleteBtn.click();
      await delay(500); // Laisser la pop-up s'ouvrir

      // (A) Sélectionner le bouton radio (value="1") avant le second clic
      let secondRadio = document.querySelector('input[type="radio"][value="1"]');
      if (secondRadio) {
        secondRadio.click();
        await delay(200);
      } else {
        console.log("Bouton radio non trouvé, on continue.");
      }

      // (B) Cliquer sur le bouton « Supprimer » dans la pop-up
      let secondDeleteBtn = Array.from(document.querySelectorAll("div[aria-label='Supprimer']"))
        .find(btn => !btn.hasAttribute("aria-disabled"));  // on évite celui qui a aria-disabled="true"

      if (secondDeleteBtn) {
        secondDeleteBtn.click();
        anyDeleted = true;
        await delay(300);
      }
    }

    // Si aucun message n'a été supprimé dans ce passage, on arrête
    if (!anyDeleted) {
      console.log("Aucun message supprimé lors de ce passage, on arrête.");
      break;
    }

    // Petite pause avant de réanalyser la conversation
    await delay(1000);
  }
}

// ----------------------------------------------------
// (3) Parcourt toutes les conversations et supprime
//     uniquement VOS messages
// ----------------------------------------------------
async function deleteAllMyMessagesInAllConversations() {
  // Adaptez ce sélecteur à votre interface Messenger :
  // Ici, on suppose que chaque conversation est un <a> ayant un href commençant par "/messages/t/"
  let conversationLinks = document.querySelectorAll("a[href^='/messages/t/']");
  console.log("Nombre de conversations détectées :", conversationLinks.length);

  for (let i = 0; i < conversationLinks.length; i++) {
    let link = conversationLinks[i];

    // Cliquer pour ouvrir la conversation
    link.click();
    await delay(2000); // Laisser le temps à la conversation de se charger

    // Supprimer VOS messages de cette conversation
    await deleteMyMessagesInCurrentConversation();

    // Si Messenger ne revient pas tout seul, vous pouvez simuler
    // un clic sur un bouton "Retour" ici (selon l'interface).
  }
}

// ----------------------------------------------------
// (4) Pour lancer la suppression dans TOUTES les conversations :
// ----------------------------------------------------
// deleteAllMyMessagesInAllConversations();

// ----------------------------------------------------
// (5) Pour ne supprimer QUE VOS messages dans la conversation actuelle :
// ----------------------------------------------------
// deleteMyMessagesInCurrentConversation();
