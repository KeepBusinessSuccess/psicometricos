// app.js
const API_URL = "URL_DE_TU_WEB_APP_DE_GOOGLE_AQUI"; // ¡Cámbialo por tu URL!

let currentSerieIndex = 0;
let timerInterval;
let idCandidato = "";
let respuestasCandidato = {}; 

const loginScreen = document.getElementById('login-screen');
const testScreen = document.getElementById('test-screen');
const finishScreen = document.getElementById('finish-screen');
const btnValidate = document.getElementById('btn-validate');
const errorMessage = document.getElementById('error-message');
const timerDisplay = document.getElementById('timer-display');

// 1. Validar ID
btnValidate.addEventListener('click', async () => {
    idCandidato = document.getElementById('candidate-id').value.trim();
    if (!idCandidato) return;

    btnValidate.innerText = "Validando...";
    errorMessage.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}?id=${idCandidato}`);
        const data = await response.json();

        if (data.valid) {
            loginScreen.style.display = 'none';
            testScreen.style.display = 'block';
            startSerie();
        } else {
            showError(data.message);
        }
    } catch (error) {
        showError("Error conectando con la base de datos.");
    }
});

function showError(msg) {
    errorMessage.innerText = msg;
    errorMessage.style.display = 'block';
    btnValidate.innerText = "Comenzar Prueba";
}

// 2. Iniciar Serie
function startSerie() {
    const currentSerie = testData[currentSerieIndex];
    
    document.getElementById('serie-title').innerText = currentSerie.title;
    document.getElementById('instructions').innerText = currentSerie.instructions;
    
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    currentSerie.questions.forEach((q, index) => {
        let html = `<div class="question-block"><p><strong>${q.text}</strong></p>`;
        for (const [key, value] of Object.entries(q.options)) {
            // Nota: Para series con múltiples respuestas (como la IV), cambiaremos type="radio" a type="checkbox" en el futuro.
            html += `<label><input type="radio" name="${q.id}" value="${key}"> ${key}) ${value}</label>`;
        }
        html += `</div>`;
        container.innerHTML += html;
    });

    // Subir el scroll al inicio de la página para la nueva serie
    window.scrollTo(0, 0);
    startTimer(currentSerie.timeLimit);
}

// 3. Temporizador Estricto + Hyperion Glow
function startTimer(seconds) {
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        seconds--;
        
        const minutes = Math.floor(seconds / 60);
        const remainderSeconds = seconds % 60;
        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${remainderSeconds.toString().padStart(2, '0')}`;
        
        // Integración de tu sistema Hyperion: Cambio de color según el tiempo
        if (seconds <= 10) {
            timerDisplay.className = "card-value glow-red";
        } else if (seconds <= 30) {
            timerDisplay.className = "card-value glow-yellow";
        } else {
            timerDisplay.className = "card-value glow-green";
        }

        if (seconds <= 0) {
            clearInterval(timerInterval);
            autoSubmitSerie(); 
        }
    }, 1000);
}

// 4. Capturar Respuestas
document.getElementById('btn-next-serie').addEventListener('click', () => {
    clearInterval(timerInterval);
    autoSubmitSerie();
});

function autoSubmitSerie() {
    const currentSerie = testData[currentSerieIndex];
    let respuestas = [];

    currentSerie.questions.forEach((q) => {
        // Busca qué input seleccionó el candidato
        const selected = document.querySelector(`input[name="${q.id}"]:checked`);
        respuestas.push(selected ? selected.value : ""); 
    });

    respuestasCandidato[`S${currentSerie.serie}`] = respuestas.join(',');

    currentSerieIndex++;
    if (currentSerieIndex < testData.length) {
        startSerie();
    } else {
        enviarExamenFinal();
    }
}

// 5. Enviar a GAS
async function enviarExamenFinal() {
    testScreen.style.display = 'none';
    
    // Mostramos estado de carga
    document.body.innerHTML += `<div id="loader" class="card"><h2 class="glow-yellow">Enviando resultados...</h2></div>`;
    
    const payload = {
        id: idCandidato,
        respuestas: respuestasCandidato
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        document.getElementById('loader').remove();
        finishScreen.style.display = 'block';
    } catch (e) {
        document.getElementById('loader').innerHTML = `<h2 class="glow-red">Error al enviar. No cierres la ventana y avisa a RRHH.</h2>`;
    }
}
