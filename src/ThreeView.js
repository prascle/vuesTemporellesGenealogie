export class ThreeView {
  constructor(container, data) {
    this.container = container;
    this.data = data;
  }

  onIndividualSelected(id) {
    // Met à jour la vue Three.js avec l'individu sélectionné
    console.log(`ThreeView: individu ${id} sélectionné`);
    // Exemple : this.updateScene(id);
  }

  onGenerationsChanged(count) {
    // Met à jour la vue avec le nouveau nombre de générations
    console.log(`ThreeView: générations mises à jour à ${count}`);
  }
}
