class Word {
    wrongStrokesCounter = 0;
    wrongStrokes = [];

    constructor(word) {
        this.word = word;
    }

    addWrongStroke(index) {
        if (this.word.length < index) {
            return;
        }

        this.wrongStrokesCounter++;
        this.wrongStrokes.push(index);
    }

    removeWrongStroke(index) {
        if (this.word.length < index) {
            return;
        }

        this.wrongStrokesCounter--;
        this.wrongStrokes.filter(storedIndex => storedIndex != index);
    }
}

class Typewriter {
    textArr = [];
    currentWord = null;
    currentIndex = 0;
    countdownTimer = null;
    renderInterval = null;
    timer = 60;
    correctStrokes = 0;
    wrongStrokes = 0;
    correctWords = 0;
    wrongWords = 0;

    gameStarted = false;

    inputEl = document.querySelector("input");
    appMsgEl = document.getElementById("app-info");
    statsInfoEl = document.getElementById("stats");
    resetBtnEl = document.getElementById('reset');
    aboutCloseBtnEl = document.getElementById('close-about');
    aboutPopupEl = document.getElementById('about');
    aboutBtnEl = document.getElementById('about-button');
    highscoresPopupEl = document.getElementById('highscores');
    highscoresBtnEl = document.getElementById('highscores-button');
    highscoresCloseBtnEl = document.getElementById('close-highscores');

    constructor() {
        this.inputEl.addEventListener("input", event => this.game(event));
        this.resetBtnEl.addEventListener('click', () => this.reset());

        this.aboutCloseBtnEl.addEventListener('click', () => {
            this.aboutPopupEl.classList.toggle('display-none');
        });

        this.aboutBtnEl.addEventListener('click', () => {
            this.aboutPopupEl.classList.toggle('display-none');
        });

        this.highscoresCloseBtnEl.addEventListener('click', () => {
            this.highscoresPopupEl.classList.toggle('display-none');
        });

        this.highscoresBtnEl.addEventListener('click', () => {
            this.highscoresPopupEl.classList.toggle('display-none');
        });

        this.getText();
    }

    game(event) {
        const key = event.data;

        if (!this.gameStarted) {
            this.gameStarted = true;
            this.appMsgEl.textContent = "Game running";
            this.startCountdown(this.gameOver.bind(this));
            this.renderStats();
        }

        // Char delete
        if (!key) {
            console.log(this.currentWord.word.length - 1, this.currentIndex);
            document.getElementById(`char-${this.currentIndex - 1}`).className =
            "";
            console.log(this.currentWord.wrongStrokes, this.currentIndex);
            if (this.currentWord.wrongStrokes.includes(this.currentIndex - 1)) {
                this.currentWord.removeWrongStroke(this.currentIndex - 1);
                this.wrongStrokes--;
            } else {
                this.correctStrokes--;
            }
            this.currentIndex--;
            return;
        }

        // Word end check
        if (this.currentWord.word.length - 1 <= this.currentIndex) {
            if (key == " ") {

                console.log(this.currentWord.wrongStrokesCounter);
                if (!this.currentWord.wrongStrokesCounter) {
                    this.correctWords++;
                } else {
                    this.wrongWords++;
                }

                this.currentWord = new Word(this.textArr[1]);
                this.textArr.splice(0, 1);
                this.currentIndex = 0;
                this.inputEl.value = "";
                this.renderAll(this.textArr);
                return;
            }
        }

        if (this.currentWord.word[this.currentIndex] == key) {
            // Update ui
            document
                .getElementById(`char-${this.currentIndex}`)
                .classList.toggle("highlight-correct");
            this.correctStrokes++;
        } else {
            document
                .getElementById(`char-${this.currentIndex}`)
                .classList.toggle("highlight-wrong");
            this.currentWord.addWrongStroke(this.currentIndex);
            this.wrongStrokes++;
        }


        if (this.currentIndex + 1 != this.currentWord.word.length) {
            this.currentIndex++;
        }
    }

    gameOver() {
        this.appMsgEl.textContent = "Any key to start";
        document.getElementById("time-left").innerText = "60";

        // Show results
        const wpm = (this.correctWords + this.wrongWords);
        const accuracy = 100 / (this.correctStrokes + this.wrongStrokes) * this.correctStrokes;

        document.getElementById('wpm').textContent = wpm;
        document.getElementById('correct-words').textContent = this.correctWords;
        document.getElementById('wrong-words').textContent = this.wrongWords;
        document.getElementById('strokes').textContent = this.correctStrokes + ' / ' + (this.correctStrokes + this.wrongStrokes);
        document.getElementById('accuracy').textContent = accuracy.toFixed(2) + '%';
        const resultsPopupEl = document.getElementById('results-popup');
        resultsPopupEl.style.display = 'block';
        this.inputEl.disabled = true;

        // Store in LS
        const scores = Highscores.getHighscores();
        scores.push(new Highscore(wpm, this.correctWords, this.wrongWords, this.correctStrokes, this.wrongStrokes, accuracy.toFixed(2)));
        Highscores.storeHighscores(scores);

        this.reset();
        document.getElementById('close').addEventListener('click', () => {
            resultsPopupEl.style.display = 'none';
            this.inputEl.disabled = false;
        });

    }

    renderAll(arr) {
        const displayEl = document.getElementById("text");
        let text = "";

        arr.forEach((word, index) => {
            if (index == 0) {
                let tmp = "";
                for (let i = 0; i < word.length; i++) {
                    tmp += `<span id="char-${i}">${word[i]}</span>`;
                }
                text += tmp + " ";
                return;
            }
            text += word + " ";
        });

        displayEl.innerHTML = text;
    }

    renderStats() {
        let renderTime = 60;
         this.renderInterval = setInterval(() => {
            renderTime--;
            const WPM =
                (60 / (60 - this.timer)) *
                (this.correctWords + this.wrongWords);
            console.log("WORD CNT", this.wrongWords);

            const strokes = ` | (${this.correctStrokes} / ${this.correctStrokes + this.wrongStrokes}) - `;
            const accuracy = 100 / (this.correctStrokes + this.wrongStrokes) * this.correctStrokes;
            this.statsInfoEl.textContent = "WPM: " + Math.floor(WPM) + strokes + accuracy.toFixed(2) + '% Accuracy';
            if (renderTime < 1) {
                clearInterval(this.renderInterval);
            }
        }, 1000);
    }

    getText() {
        this.fetchText().then(text => {
            this.textArr = text.split(" ");
            this.currentWord = new Word(this.textArr[0]);
            console.log(this.currentWord);
            this.renderAll(this.textArr);
        });
    }

    fetchText() {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(
                "GET",
                "https://www.randomtext.me/api/gibberish/p-1/200-250/txt"
            );

            xhr.onload = () => {
                resolve(JSON.parse(xhr.response).text_out);
            };

            xhr.send();
        });
    }

    startCountdown(cb) {
        this.countdownTimer = setInterval(() => {
            this.timer--;
            if (this.timer < 1) {
                clearInterval(this.countdownTimer);
                cb();
            }
            document.getElementById("time-left").innerText = this.timer;
        }, 1000);
    }



    reset() {
        this.getText();
        this.correctStrokes = 0;
        this.wrongStrokes = 0;
        this.correctWords = 0;
        this.wrongWords = 0;
        this.currentIndex = 0;
        this.timer = 60;
        this.gameStarted = false;
        this.statsInfoEl.textContent = '';
        this.inputEl.value = '';
        document.getElementById("time-left").textContent = '60';
        Highscores.render();
        clearInterval(this.countdownTimer);
        clearInterval(this.renderInterval);
        this.appMsgEl.textContent = "Any key to start";
    }
}

class Highscores {
    static gotStoredHighscores() {
        return localStorage.getItem('highscores') ? true : false;
    }

    static storeHighscores(highscoreArr) {
        // Sort by rating
        const arrCopy = [...highscoreArr];
        arrCopy.sort((a, b) => {
            console.log(a.getRating(), ' - ' ,b.getRating());

            if (a.getRating() > b.getRating()) {
                return -1;
            }

            if (a.getRating() < b.getRating()) {
                return 1;
            }

            return 0;
        });

        console.log('Arr copy: ', arrCopy);

        if (arrCopy.length > 10) {
            arrCopy.splice(9);
        }

        localStorage.setItem('highscores', JSON.stringify(arrCopy));
    }

    static getHighscores() {
        if (!Highscores.gotStoredHighscores()) {
            return [];
        }

        const scores = JSON.parse(localStorage.getItem('highscores'));

        const scoresArr = [];

        scores.forEach(score => {
            scoresArr.push(new Highscore(score.wpm, score.correctWords, score.wrongWords, score.correctStrokes, score.wrongStrokes, score.accuracy));
        });

        return scoresArr;
    }

    static render() {
        const tableEl = document.getElementById('scores-table');

        if (!Highscores.gotStoredHighscores()) {
            tableEl.innerHTML = '<h1>No local highscores.</h1>';
            return;
        } 

        tableEl.innerHTML = '';

        const tableHeadEl = document.createElement('tr');
        tableHeadEl.innerHTML = `
            <th>#</th>
            <th>WPM</th>
            <th>Correct Words</th>
            <th>Wrong Words</th>
            <th>Correct Strokes</th>
            <th>Wrong Strokes</th>
            <th>Accuracy</th>
        `;
        tableEl.appendChild(tableHeadEl);

        const scores = Highscores.getHighscores();
        let rank = 1;

        scores.forEach(score => {
            const trEl = document.createElement('tr');
            const rankTdEl = document.createElement('td');
            rankTdEl.textContent = rank;
            trEl.appendChild(rankTdEl);
            rank++;
            for (const prop in score) {
                const tdEl = document.createElement('td');
                if (prop == 'accuracy') {
                    tdEl.textContent = score[prop] + '%';
                } else {
                    tdEl.textContent = score[prop];
                }
                trEl.appendChild(tdEl);
            }
            tableEl.appendChild(trEl);
        });
    }
}

class Highscore {
    constructor(wpm, correctWords, wrongWords, correctStrokes, wrongStrokes, accuracy) {
        this.wpm = wpm;
        this.correctWords = correctWords;
        this.wrongWords = wrongWords;
        this.correctStrokes = correctStrokes;
        this.wrongStrokes = wrongStrokes;
        this.accuracy = accuracy;
    }

    getRating() {
        return this.correctStrokes - this.wrongStrokes;
    }
}

Highscores.render();


const app = new Typewriter();
