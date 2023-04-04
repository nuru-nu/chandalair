import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore-lite.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";


// https://firebase.google.com/docs/reference/js/firestore_lite

export class Database {

  constructor(config, defaults) {
    this.app = initializeApp(config);
    this.db = getFirestore(this.app);
    this.defaults = {...defaults};
    this.creds = null;
  }

  async login(email, password) {
    this.creds = await signInWithEmailAndPassword(getAuth(), email, password);
    console.log(this.creds);
    return (await getDoc(await doc(this.db, 'config/tokens'))).data();
  }

  async log(values) {
    const msgsCol = collection(this.db, 'events');
    const t = Date.now();
    return await addDoc(msgsCol, {...this.defaults, ...values, t});
  }
}


export class Logger {

  async log(values) {
    console.log('log', values);
  }

}
