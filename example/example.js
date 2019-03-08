(function (window, document) {
  var canvas, ctx;

  window.onload = function () {
    canvas = document.getElementById("canvas");
    canvas.width = 600;
    canvas.height = 500;
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    ImageContext.setDirectory("assets/");
    ImageContext.load(["tile_01.png", "tile_02.png", "tile_04.png"]).then(createHexGrid);
  }

  function createHexGrid() {
    var hexGrid = HexToolkit.Generator.hexagon(5, function (hexagon) {
      var rand = Math.random();
      if (rand < 0.333) {
        hexagon.image = ImageContext.get("tile_01.png");
      }
      else if (rand < 0.666) {
        hexagon.image = ImageContext.get("tile_02.png");
      }
      else {
        hexagon.image = ImageContext.get("tile_04.png");
      }
      return hexagon;
    });
    hexGrid.setOrigin(canvas.width*0.5, canvas.height*0.5);
    hexGrid.setHexSize(50, 50);

    hexGrid.drawImages(ctx, function (hex) {
      return hex.image;
    });
    // hexGrid.drawShapes(ctx, function () {
    //   ctx.stroke();
    // });

    canvas.onclick = function (e) {
      var position = getMousePosition(e);
      var hex = hexGrid.getHexagon(position.x, position.y);
      console.log(hex);
      if (hex != null) {
        hex.neighborsInRing(2);
      }

      var neighbors = hexGrid.getNeighbors(hex);
      console.log(neighbors);
    }
  }

  function getMousePosition(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(canvas.width * (e.clientX - rect.left) / (rect.right - rect.left)),
      y: Math.round(canvas.height * (e.clientY - rect.top) / (rect.bottom - rect.top))
    };
  }

})(window, window.document);
