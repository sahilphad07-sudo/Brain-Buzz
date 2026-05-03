let TARGET_QUESTIONS = 30; 
let MIN_TO_SUBMIT = 10;

let allData = {};
let questions = [];
let currentIndex = 0;
let userAnswers = {};


let timer;
let timeLeft = 7200;


let sessionStarted = false;


fetch("question.json")
    .then(res => res.json())
    .then(data => {
        allData = data;
        displayLeaderboard();
    })
    .catch(err => console.error("Error loading JSON:", err));


document.getElementById("start-btn").addEventListener("click", startQuiz);
document.getElementById("restart-btn").addEventListener("click", restartApp);

document.getElementById("next-btn").addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        showquestion();
    }
});

document.getElementById("skip-btn").addEventListener("click", () => {
    currentIndex++;
    if (currentIndex < questions.length) {
        showquestion();
    }
});

document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentIndex > 0) {
        currentIndex--;
        showquestion();
    }
});

document.getElementById("submit-btn").addEventListener("click", () => {
    let totalSolved = 0;
    for (let key in userAnswers) {
        totalSolved++;
    }

    if (totalSolved < MIN_TO_SUBMIT) {
        alert(`Solve at least ${MIN_TO_SUBMIT} questions first!`);
        return;
    }

    showResult();
});


function startQuiz() {
    let category = document.getElementById("category").value;
    let difficulty = document.getElementById("difficulty").value;
    let username = document.getElementById("username").value;

    if (!category || !difficulty || !username.trim()) {
        alert("Fill all fields!");
        return;
    }

   
    if (difficulty === "all") {
        questions = [
            ...(allData[category]["easy"] || []),
            ...(allData[category]["medium"] || []),
            ...(allData[category]["hard"] || [])
        ];
    } else {
        questions = [...allData[category][difficulty]];
    }

    // STRICTLY 30 QUESTIONS
    TARGET_QUESTIONS = 30;
    MIN_TO_SUBMIT = Math.min(10, TARGET_QUESTIONS);

    //this helps to shuffle
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    
    if (!sessionStarted) {
        currentIndex = 0;
        userAnswers = {};
        timeLeft = 7200;
        sessionStarted = true;
        
        startTimer();
    } else {
        currentIndex = 0;
    }

    
    document.getElementById("setup-section").style.display = "none";
    document.getElementById("quiz-section").style.display = "block";
    document.getElementById("result-section").style.display = "none";
    document.getElementById("submit-btn").style.display = "block";
    document.getElementById("sidebar").style.display = "block";

    document.getElementById("username").readOnly = true;
    document.getElementById("player-name").innerText = username;
    document.getElementById("current-category").innerText = category;

    document.getElementById("side-category").innerText = category;
    document.getElementById("side-difficulty").innerText = difficulty;

    updateSubmitButton();
    updateSidebar();
    updateProgressBar();
    showquestion();
}


function startTimer() {
    clearInterval(timer);

    timer = setInterval(function () {
        let hrs = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
        let mins = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
        let secs = String(timeLeft % 60).padStart(2, '0');

        document.getElementById("timer").innerText = `${hrs}:${mins}:${secs}`;

        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timer);
            alert("Time up!");
            showResult();
        }

    }, 1000);
}


function showquestion() {
    let q = questions[currentIndex];

    document.getElementById("question-text").innerText =
        `${currentIndex + 1}. ${q.question}`;

    let container = document.getElementById("options-container");
    container.innerHTML = "";

    q.options.forEach(opt => {
        let btn = document.createElement("button");
        btn.innerText = opt;

        if (userAnswers[q.question] &&
            userAnswers[q.question].selected === opt) {
            btn.style.background = "#add8e6";
            btn.style.border = "2px solid #007bff";
        }

        btn.addEventListener("click", () => {
            userAnswers[q.question] = {
                selected: opt,
                correct: q.answer
            };

            showquestion();
            updateSubmitButton();
            updateSidebar();
            updateProgressBar();
        });

        container.appendChild(btn);
    });
}



function updateProgressBar() {
    let totalSolved = 0;
    for (let key in userAnswers) {
        totalSolved++;
    }

    
    let percent = (totalSolved / TARGET_QUESTIONS) * 100;

    
    if (percent > 100) percent = 100;

    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("progressText").innerText = Math.round(percent) + "%";
}


function updateSubmitButton() {
    let btn = document.getElementById("submit-btn");

    let totalSolved = 0;
    for (let key in userAnswers) {
        totalSolved++;
    }
    
    let remaining = MIN_TO_SUBMIT - totalSolved;

    if (remaining <= 0) {
        btn.innerText = `Submit Quiz (${totalSolved}/${TARGET_QUESTIONS})`;
        btn.disabled = false;
        btn.style.opacity = "1";
    } else {
        btn.innerText = `Solve ${remaining} more`;
        btn.disabled = true;
        btn.style.opacity = "0.5";
    }
}


function updateSidebar() {
    let totalSolved = 0;
    for (let key in userAnswers) {
        totalSolved++;
    }

    document.getElementById("side-solved").innerText =
        `${totalSolved} / ${TARGET_QUESTIONS}`;
}


function showResult() {
   
    clearInterval(timer);

    document.getElementById("quiz-section").style.display = "none";
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("result-section").style.display = "block";
    document.getElementById("sidebar").style.display = "none";

    let score = 0;

    for (const q in userAnswers) {
        if (userAnswers[q].selected === userAnswers[q].correct) {
            score++;
        }
    }

    document.getElementById("final-score").innerText =
        `Your score: ${score} / ${TARGET_QUESTIONS}`;

    let percent = TARGET_QUESTIONS === 0 ? 0 : (score / TARGET_QUESTIONS) * 100;

    let msg =
        percent >= 80 ? "Excellent!" :
        percent >= 50 ? "Good Job!" :
        "Keep Practicing!";

    document.getElementById("performance-msg").innerText = msg;

    saveToLeaderboard(document.getElementById("username").value, score);

    
    sessionStarted = false;
}


function saveToLeaderboard(name, score) {

    let leaderboard = JSON.parse(localStorage.getItem("brainBuzzLeaderboard")) || [];

    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);

    localStorage.setItem("brainBuzzLeaderboard", JSON.stringify(leaderboard));
    displayLeaderboard();

}

function displayLeaderboard() {

    let leaderboard = JSON.parse(localStorage.getItem("brainBuzzLeaderboard")) || [];
    let list = document.getElementById("leaderboard-section");

    list.innerHTML = "";

    leaderboard.forEach(player => {
        let li = document.createElement("li");
        li.innerText = `${player.name} - ${player.score}`;
        list.appendChild(li);
    });

}


function goBack() {
    
    document.getElementById("setup-section").style.display = "block";
    document.getElementById("quiz-section").style.display = "none";
    document.getElementById("result-section").style.display = "none";
    document.getElementById("sidebar").style.display = "none";
    document.getElementById("submit-btn").style.display = "none";

    document.getElementById("question-text").innerText = "Question appears here";
    document.getElementById("options-container").innerHTML = "";

}


function restartApp() {
    clearInterval(timer);
    location.reload();
}