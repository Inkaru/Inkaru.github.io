// based on http://www.arendpeter.com/Perlin_Noise.html

function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');
    textSize(15);
    noStroke();

    persistenceSlider = createSlider(0, 1, 0.5,0);
    persistenceSlider.position(20, 20);
    octavesSlider = createSlider(1, 10, 3, 1);
    octavesSlider.position(20, 50);
    ratioSlider = createSlider(0,1,0.9,0);
    ratioSlider.position(20, 80);
}

function draw() {
    background(51);
    fill(255);
    text('persistence: ' + persistenceSlider.value(), persistenceSlider.x * 2 + persistenceSlider.width, 35);
    text('octaves: ' + octavesSlider.value(), octavesSlider.x * 2 + octavesSlider.width, 65);
    text('ratio: ' + ratioSlider.value(), ratioSlider.x * 2 + ratioSlider.width, 95);

    stroke(255);
    noFill();
    beginShape();
    for (var x = 0; x< windowWidth; x++){
        n = perlinNoise(x*ratioSlider.value()*0.5);
        // console.log(n);
        vertex(x, windowHeight*n*0.07 + windowHeight/2);
    }
    endShape();

    // noLoop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function perlinNoise(x){
    total = 0;
    p = persistenceSlider.value();
    n = octavesSlider.value();

    for (var i = 0; i < n; i++){
        frequency = Math.pow(2,i);
        amplitude = Math.pow(p,i);
        // console.log("freq:" + frequency + ",ampl:" + amplitude);

        total += interpolatedNoise(x*frequency) * amplitude;
    }

    return total;
}

function Noise(x){
    x = (x<<13) ^ x;
    r = ( 1.0 - ( (x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    // console.log(r);
    return r;
    // return random(x);
}

function smoothedNoise(x){
    return Noise(x-1)/4 + Noise(x)/2 + Noise(x+1)/4
}

function interpolatedNoise(x){
    integerX = Math.floor(x);
    fractX = x - integerX;

    v1 = smoothedNoise(integerX);
    v2 = smoothedNoise(integerX + 1);

    return interpolate(v1,v2,fractX);
}

function interpolate(a,b,x){
    // cosine interpolation
    ft = Math.PI * x;
    f = (1-Math.cos(ft)) * 0.5;
    return a*(1-f) + b*f;
}
