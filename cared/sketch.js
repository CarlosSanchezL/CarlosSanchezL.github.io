
//Variables para compartir
let video;
let canvas;
let datos;

//creación del sketch
const s = ( sketch ) => {

  sketch.preload = () => {
    datos = sketch.loadJSON ('frases.json');
  }

  
  sketch.setup = () => {
    canvas = sketch.createCanvas(1200, 500);
    video = sketch.createCapture(sketch.VIDEO);
    video.size(200, 200);
    video.hide();
    if (datos && datos.frases){
      let i = sketch.floor(sketch.random(datos.frases.length));
      frase = datos.frases[i];
    }
  };

  sketch.draw = () => {
    sketch.image(video, 600, 200);
    //sketch.filter(sketch.INVERT);
    sketch.textSize(12);
    sketch.textAlign(sketch.CENTER, sketch.CENTER);
    sketch.fill(0);
    let randomPhrase = sketch.random(datos.frases);
    sketch.text(frase, 1000, 100);
  };

  sketch.addText = () =>{
    console.log("hola");
    sketch.textSize(12);
    sketch.textAlign(sketch.CENTER, sketch.CENTER);
    sketch.fill(0);
    let randomPhrase = sketch.random(datos.frases);
    sketch.text(frase, 1000, 100);
   }

};

//Crear una variable para referencia el canvas
let myp5 = new p5(s,document.getElementById('p5'));