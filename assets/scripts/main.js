"use strict";

class Controls {
    __setNewResizeDimension(width, height) {
        this.resizeDimension = new cv.Size(width, height);
    }
    __setFontSize(fs) {
        this.asciiImagediv.style.fontSize = `${fs}pt`;
    }
    __setLineHeight(lh) {
        this.asciiImagediv.style.lineHeight = `${lh}pt`;
    }
    __setFontColor(color) {
        this.asciiImagediv.style.color = color;
    }
    __resetValues() {
        this.__setNewResizeDimension(128, 72);
        this.__setFontSize(4);
        this.__setLineHeight(4);
        this.__setFontColor("#ffffff");
    }
    __reverseDensity() {
        this.DENSITY = this.DENSITY.split("").reverse().join("");
    }
}

class App extends Controls {
    constructor() {
        super();
        this.asciiImagediv = document.querySelector("#output");
        this.messageModal = document.querySelector(".message-modal");
        this.videoEl = document.createElement("video");
        this.videoEl.width = 640;
        this.videoEl.height = 480;

        this.DENSITY = "      .:-i|=+%O#@";
        this.resizeDimension = new cv.Size(256, 144);

        // * Event listeners for controls
        const resolutionSelector = document.querySelector("#resolutions");
        const resetBtn = document.querySelector("#reset-btn");
        const inverseBtn = document.querySelector("#inverse-btn");
        const fontColorSelector = document.querySelector(
            "#font-color-selector"
        );
        const fontSizeSelector = document.querySelector("#font-size-selector");
        const lineHeightSelector = document.querySelector(
            "#line-height-selector"
        );

        resolutionSelector.addEventListener("change", (e) => {
            const [width, height] = e.target.value.split("x");
            this.__setNewResizeDimension(+width, +height);
        });
        fontSizeSelector.addEventListener("change", (e) => {
            this.__setFontSize(+e.target.value);
        });
        lineHeightSelector.addEventListener("change", (e) => {
            this.__setLineHeight(+e.target.value);
        });
        fontColorSelector.addEventListener("change", (e) => {
            this.__setFontColor(e.target.value);
        });
        resetBtn.addEventListener("click", () => {
            this.__resetValues();
            lineHeightSelector.value = "4";
            fontSizeSelector.value = "4";
            fontColorSelector.value = "#ffffff";
            resolutionSelector.value = "128x72";
        });
        inverseBtn.addEventListener("click", () => this.__reverseDensity());
    }

    __getCharacterIndex(pixel) {
        /*
         * Maps the value of pixel to a character in DENSITY string
         */
        const raw_position = Math.floor(pixel / this.DENSITY.length);
        const remainder = pixel % this.DENSITY.length;

        const charIndex =
            remainder < this.DENSITY.length / 2
                ? raw_position + 1
                : raw_position;
        return this.DENSITY[Math.floor(charIndex)];
    }

    __asciiImageString(data, width) {
        /*
         * Creates an ascii string from webcam stream
         */
        let img = "";

        for (let i = 0; i < data.length; i += 1) {
            const char = this.__getCharacterIndex(data[i]);

            img += char === " " ? "&nbsp;" : char;

            if (i % width === 0) {
                img += "<br/>";
            }
        }
        return img;
    }

    __processWebcamFeedToASCII() {
        /*
         * Process each webcam feed frame and converts it into ascii string
         */
        try {
            this.videoCapture.read(this.srcMat);
            cv.cvtColor(this.srcMat, this.dstMat, cv.COLOR_RGBA2GRAY);

            cv.resize(
                this.dstMat,
                this.dstMat,
                this.resizeDimension,
                0,
                0,
                cv.INTER_AREA
            );

            let asciiImg = this.__asciiImageString(
                this.dstMat.data,
                this.resizeDimension.width
            );
            this.asciiImagediv.innerHTML = asciiImg;
            setTimeout(() => this.__processWebcamFeedToASCII(), 0);
        } catch (err) {
            console.error(err);
        }
    }

    async __getCameraStreamAccess() {
        /*
         * Prompts user for permission to access camera
         */
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;
        navigator.mediaDevices?.getUserMedia ||
            alert("Your device doesn't support this application");
        navigator.permissions.query({ name: "camera" }).then(function (result) {
            if (result.state === "prompt") {
                document
                    .querySelector(".message-modal")
                    .querySelector("h1").textContent =
                    "Allow our site to access your camera";
            }
        });
        return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        });
    }

    async run() {
        // * Main function where everything starts
        try {
            this.videoEl.srcObject = await this.__getCameraStreamAccess();
            this.messageModal.style.display = "none";
            this.videoEl.play();

            this.srcMat = new cv.Mat(
                this.videoEl.height,
                this.videoEl.width,
                cv.CV_8UC4
            );
            this.dstMat = new cv.Mat(
                this.videoEl.height,
                this.videoEl.width,
                cv.CV_8UC1
            );
            this.videoCapture = new cv.VideoCapture(this.videoEl);

            // Starts the loop
            setTimeout(this.__processWebcamFeedToASCII.bind(this), 0);
        } catch (e) {
            if (e.name === "NotAllowedError") {
                this.messageModal.style.display = "flex";
                this.messageModal.querySelector("h1").textContent =
                    "Unblock your webcam acess to our site";
            }
        }
    }
}

const app = new App();
app.run();
