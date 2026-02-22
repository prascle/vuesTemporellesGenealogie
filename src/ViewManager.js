export class ViewManager {
  constructor() {
    this.views = []; // Liste des vues enregistrées
    this.selectedIndividual = null;
    this.generations = 3;
  }

  // Enregistrement d'une vue
  registerView(view) {
    this.views.push(view);
    // Notifie la vue de l'état actuel
    view.onIndividualSelected(this.selectedIndividual);
    view.onGenerationsChanged(this.generations);
  }

  // Sélection d'un individu
  selectIndividual(id) {
    this.selectedIndividual = id;
    this.views.forEach(view => view.onIndividualSelected(id));
  }

  // Changement du nombre de générations
  setGenerations(count) {
    this.generations = count;
    this.views.forEach(view => view.onGenerationsChanged(count));
  }
}
