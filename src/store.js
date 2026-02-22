// store.js
import create from 'zustand';

export const useStore = create(set => ({
  selectedIndividual: null,
  generations: 3,
  selectIndividual: (id) => set({ selectedIndividual: id }),
  setGenerations: (count) => set({ generations: count }),
}));

// Utilisation dans le ViewManager
import { useStore } from './store.js';

export class ViewManager {
  constructor() {
    this.state = useStore();
  }

  selectIndividual(id) {
    this.state.selectIndividual(id);
  }

  setGenerations(count) {
    this.state.setGenerations(count);
  }
}
