(function (window, document) {
  var canvas, ctx;

  window.onload = function () {
    canvas = document.getElementById("canvas");
    canvas.width = 600;
    canvas.height = 500;
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    ImgManager.setMainDirectory("assets/");
    ImgManager.load(["tile_01.png", "tile_02.png", "tile_04.png"]).then(init);
  }

  function init() {
    let map = new HexagonMap();
    map.setOrigin(canvas.width*0.5, canvas.height*0.5);
    map.setTileDimensions(50, 50);

    map.create("hexagon", 2, createHexagon);
    console.log(map);

    map.draw(ctx);
    canvas.onclick = (e) => {
      let position = getMousePosition(e);
      let hex = map.getHexagon(position.x, position.y);
      console.log(hex);
      let n = map.getNeighbors(hex);
      console.log(n);
    }
  }

  function createHexagon(hex) {
    let rand = Math.random();
    if (rand < 0.333) {
      hex.image = ImgManager.get("tile_01.png");
    }
    else if (rand < 0.666) {
      hex.image = ImgManager.get("tile_02.png");
    }
    else {
      hex.image = ImgManager.get("tile_04.png");
    }
    return hex;
  }

  function getMousePosition(e){
    var rect = canvas.getBoundingClientRect();
    var pos_x = Math.round( (e.clientX - rect.left)/(rect.right - rect.left) * canvas.width );
    var pos_y = Math.round( (e.clientY - rect.top)/(rect.bottom - rect.top) * canvas.height );
    return {x: pos_x, y: pos_y};
  }

})(window, window.document);
