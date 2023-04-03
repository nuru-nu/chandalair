import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore-lite.js";

// https://firebase.google.com/docs/reference/js/firestore_lite

export class Database {
  constructor(config, defaults) {
    this.app = initializeApp(config);
    this.db = getFirestore(this.app);
    this.defaults = {...defaults};
  }

  async log(values) {
    const msgsCol = collection(this.db, 'events');
    const t = Date.now();
    return await addDoc(msgsCol, {...this.defaults, ...values, t});
  }
}
