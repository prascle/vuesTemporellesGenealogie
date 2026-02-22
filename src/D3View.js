export class D3View {
  constructor(container, data) {
    this.container = container;
    this.data = data;
  }

  onIndividualSelected(id) {
    // Met à jour la vue D3.js avec l'individu sélectionné
    console.log(`D3View: individu ${id} sélectionné`);
    // Exemple : this.render(this.data, id);
  }

  onGenerationsChanged(count) {
    // Met à jour la vue avec le nouveau nombre de générations
    console.log(`D3View: générations mises à jour à ${count}`);
  }
}
