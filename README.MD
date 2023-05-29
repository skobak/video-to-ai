## How to run

1. Be sure you have node version >= 17

```
nvm install 17
nvm use 17
```

2. Install and run the https://github.com/AUTOMATIC1111/stable-diffusion-webui
   on your local machine

3. Run the script

Default run:

```
npm i
node main.js
```

parameters

```
// -v <video path>
// -p <prompt>
// -i <prompt input file path> !NB, this flag will run Scenario 2
// -f <number of frame>
// -c <creativity scale 1-30>
// -d <denoising strength 0-1>
// -s <seed>
```

Example of add AI filter on video (Scenario 1)

```
node main.js -p="Make it look like a painting in modern style" -v='./video.mp4'
```

Example of starting from certain frame and go wild(Scenario 2)

```
node main.js -i="./prompts.txt" -v='./video.mp4' -c=14.4 -d=0.5
```

!NB, don't forget to generate your prompts and put into a prompts.txt
