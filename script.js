// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDYS8Fg3OanCFCAnDbZoVy8IWPaXN3VrQY",
    authDomain: "guess-the-line-authentication.firebaseapp.com",
    projectId: "guess-the-line-authentication",
    storageBucket: "guess-the-line-authentication.firebasestorage.app",
    messagingSenderId: "132299052897",
    appId: "1:132299052897:web:9fb18348c8a41d4439d720",
    measurementId: "G-5W36FLZFBT"
  };
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore(); // Firestore database

// UI Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login');
const signupButton = document.getElementById('signup');
const logoutButton = document.getElementById('logout');
const saveGraphButton = document.getElementById('saveGraph');
const loadGraphButton = document.getElementById('loadGraph');
const statusMessage = document.getElementById('status');
const authForm = document.getElementById('auth');
const userInfo = document.getElementById('user-info');
const userEmailDisplay = document.getElementById('user-email');

// Initialize Desmos
// Get the calculator container
const elt = document.getElementById('calculator');

// Create a Desmos graphing calculator instance
const calculator = Desmos.GraphingCalculator(elt, {
    expressions: true,  
    settingsMenu: false, // Hide settings menu
});

// Set a hidden function that the user must guess
const hiddenFunction = 'y=2x+3'; // This is the function users are trying to guess
calculator.setExpression({
    id: 'hidden',
    latex: hiddenFunction,
    color: Desmos.Colors.BLUE,
    secret: true
});

// Second Function with a variable

const hiddenFunction2 = 'y=ax^2+(4/a)'; // This is the function users are trying to guess

calculator.setExpression({
    id: 'variable_a',
    latex: 'a=1',
    sliderBounds: { min: 0, max: 10, step: 0 }
});

calculator.setExpression({
    id: 'hidden2',
    latex: hiddenFunction2,
    color: Desmos.Colors.GREEN,
    secret: true
});


// Login Functionality
document.getElementById('login').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('User logged in:', userCredential.user);
            alert(`Welcome back, ${userCredential.user.email}!`);
        })
        .catch(error => {
            console.error('Login error:', error);
            alert(error.message);
        });
});

// Sign-Up Functionality
document.getElementById('signup').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('User signed up:', userCredential.user);
            alert(`Account created for ${userCredential.user.email}`);
        })
        .catch(error => {
            console.error('Sign-up error:', error);
            alert(error.message);
        });
});

// Log Out Functionality
logoutButton.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            console.log('User logged out');
            alert('You have been logged out.');
        })
        .catch(error => {
            console.error('Logout error:', error);
        });
});

// Handle Auth State Changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is logged in
        console.log('User is logged in:', user);
        authForm.style.display = 'none'; // Hide the login/signup form
        userInfo.style.display = 'block'; // Show the user info section
        userEmailDisplay.textContent = `Logged in as: ${user.email}`; // Display user email
    } else {
        // User is logged out
        console.log('No user is logged in');
        authForm.style.display = 'flex'; // Show the login/signup form
        userInfo.style.display = 'none'; // Hide the user info section
        userEmailDisplay.textContent = ''; // Clear any previous user email
    }
});

// Save Graph
saveGraphButton.addEventListener('click', () => {
    const state = calculator.getState(); // Get the current graph state
    const user = auth.currentUser;

    if (!user) {
        alert('You must be logged in to save your graph!');
        return;
    }

    db.collection('graphs').add({
        uid: user.uid, // Associate with the logged-in user
        email: user.email,
        state,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('Graph saved successfully!');
    }).catch((error) => {
        console.error('Error saving graph:', error);
        alert('Failed to save graph.');
    });
});

// Load Graph
loadGraphButton.addEventListener('click', () => {
    const user = auth.currentUser;

    if (!user) {
        alert('You must be logged in to load your graphs!');
        return;
    }

    db.collection('graphs')
        .where('uid', '==', user.uid) // Filter by the current user's graphs
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                alert('No graphs found!');
                return;
            }

            // Load the first graph in the list
            const graph = querySnapshot.docs[0].data();
            calculator.setState(graph.state); // Restore the graph state
            alert('Graph loaded successfully!');
        })
        .catch((error) => {
            console.error('Error loading graph:', error);
            alert('Failed to load graphs.');
        });
});

// Toggle UI Based on Auth State
function toggleAuthUI(isLoggedIn) {
    if (isLoggedIn) {
        document.getElementById('auth').style.display = 'none';
        document.getElementById('graphControls').style.display = 'block';
    } else {
        document.getElementById('auth').style.display = 'block';
        document.getElementById('graphControls').style.display = 'none';
    }
}

// Monitor Auth State
auth.onAuthStateChanged((user) => {
    if (user) {
        statusMessage.textContent = `Welcome, ${user.email}`;
        toggleAuthUI(true);
    } else {
        statusMessage.textContent = 'Please log in.';
        toggleAuthUI(false);
    }
});
