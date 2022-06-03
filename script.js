"use strict";
const div = document.querySelector("div");

const constraints = {
    video: { width: { min: 1280 }, height: { min: 720 } },
    video: { width: { min: 640 }, height: { min: 480 } },
    // video: { width: { min: 320 }, height: { min: 240 } },
};

const DENSITY = "      .:-i|=+%O#@";

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    const videoEl = document.createElement("video");
    videoEl.srcObject = stream;

    const canvas = document.createElement("canvas");
    canvas.width = constraints.video.width.min;
    canvas.height = constraints.video.height.min;
    const ctx = canvas.getContext("2d");

    // const canvas2 = document.createElement("canvas");
    // canvas2.width = constraints.video.width.min;
    // canvas2.height = constraints.video.height.min;
    // const ctx2 = canvas2.getContext("2d");
    // document.body.append(canvas2);

    videoEl.autoplay = true;

    function getCharacterIndex(pixel) {
        const raw_position = Math.floor(pixel / DENSITY.length);
        const remainder = pixel % DENSITY.length;

        const charIndex =
            remainder < DENSITY.length / 2 ? raw_position + 1 : raw_position;
        return DENSITY[Math.floor(charIndex)];
    }

    function asciiImage(data, width) {
        let img = "";

        for (let i = 0; i < data.length; i += 4) {
            const red = data[i + 0];
            const green = data[i + 1];
            const blue = data[i + 2];
            const average = Math.floor((red + blue + green) / 3);

            const char = getCharacterIndex(average);

            img += char === " " ? "&nbsp;" : char;

            if (i % (width * 4) === 0) {
                img += "<br/>";
                // console.log(`New row at ${i}`);
            }
        }
        return img;
    }

    function computeFrame() {
        ctx.drawImage(videoEl, 0, 0);

        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        const image = asciiImage(data, canvas.width);
        div.innerHTML = image;

        // ctx2.putImageData(frame, 0, 0);
    }

    let running = true;
    function frameLoop() {
        computeFrame();

        running && setTimeout(frameLoop, 0);
    }

    videoEl.addEventListener("playing", () => {
        frameLoop();
    });
    document.body.addEventListener("click", () => {
        running = !running;
    });
});
