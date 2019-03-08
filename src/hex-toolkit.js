(function (root, factory) {
  if (typeof define === 'function' && define.amd) { define([], factory); }
  else if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.HexToolkit = factory(); }
}(this, function () {
  'use strict';

  var LAYOUT = {
    FLAT: {
      f0: 1.5, f1: 0, f2: Math.sqrt(3) * 0.5, f3: Math.sqrt(3),
      b0: 2 / 3, b1: 0, b2: -1 / 3, b3: Math.sqrt(3) / 3,
      size: {x: 2, y: Math.sqrt(3)},
      rotation: 0
    },
    POINTY: {
      f0: Math.sqrt(3), f1: Math.sqrt(3) * 0.5, f2: 0, f3: 1.5,
      b0: Math.sqrt(3) / 3, b1: -1 / 3, b2: 0, b3: 2 / 3,
      size: {x: Math.sqrt(3), y: 2},
      rotation: 30
    }
  };

  var NEIGHBORS = {
    HEX: [
      {q: 1, r: 0}, {q: 1, r: -1}, {q: 0, r: -1},
      {q: -1, r: 0}, {q: -1, r: 1}, {q: 0, r: 1}
    ],
    CUBIC: [
      {x: 1, y: -1, z: 0}, {x: 1, y: 0, z: -1}, {x: 0, y: 1, z: -1},
      {x: -1, y: 1, z: 0}, {x: -1, y: 0, z: 1}, {x: 0, y: -1, z: 1}
    ]
  };


  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpCube(a, b, t) {
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      z: lerp(a.z, b.z, t)
    };
  }

  function newHexagon(hexagon) {
    return hexagon;
  }


  var Cube = function (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  };

  Cube.prototype = {
    key: function () {
      return "" + this.x + "," + this.y + "," + this.z;
    },

    equals: function (cube) {
      return (this.x === cube.x && this.y === cube.y && this.z === cube.z);
    },

    add: function (cube) {
      return new Cube(this.x + cube.x, this.y + cube.y, this.z + cube.z);
    },

    substract: function (cube) {
      return new Cube(this.x - cube.x, this.y - cube.y, this.z - cube.z);
    },

    scale: function (k) {
      return new Cube(this.x * k, this.y * k, this.z * k);
    },

    round: function () {
      var rx = Math.round(this.x),
          ry = Math.round(this.y),
          rz = Math.round(this.z);
      var dx = Math.abs(rx - this.x),
          dy = Math.abs(ry - this.y),
          dz = Math.abs(rz - this.z);

      if(dx > dy && dx > dz) {
        rx = - ry - rz;
      }
      else if (dy > dz) {
        ry = - rx - rz;
      }
      else {
        rz = - rx - ry;
      }
      return new Cube(rx, ry, rz);
    },

    distanceTo: function (cube) {
      return 0.5 * (Math.abs(this.x-cube.x) + Math.abs(this.y-cube.y) + Math.abs(this.z-cube.z));
    },

    lineTo: function (cube) {
      var dist = this.distanceTo(cube);
      var result = [], c = null;
      for (var i = 0; i <= dist; i++) {
        c = lerpCube(this, cube, i/dist);
        result.push(new Cube(c.x, c.y, c.z).round());
      }
      return result;
    },

    neighbors: function () {
      var result = [];
      for (var i = 0; i < NEIGHBORS.CUBIC.length; i++) {
        result.push(this.add(NEIGHBORS.CUBIC[i]));
      }
      return result;
    },

    neighborsInRange: function (range) {
      var result = [];
      var cube = null;
      for (var x = -range; x <= range; x++) {
        for (var y = Math.max(-range, -x-range); y <= Math.min(range, -x+range); y++) {
          cube = new Cube(x, y, -x-y).add(this);
          if (cube.x != this.x || cube.y != this.y) {
            result.push(cube);
          }
        }
      }
      return result;
    },

    neighborsInRing: function (radius) {
      if (radius == 0) return new Cube(this.x, this.y, this.z);
      var result = [];
      var cube = this.add(new Cube(1, -1, 0).scale(radius));
      for (var i = 0; i < 6; i++) {
        for (var j = 0; j < radius; j++) {
          result.push(cube);
          cube = cube.add(NEIGHBORS.CUBIC[i]);
        }
      }
      return result;
    },

    neighborsInReach: function (n, funcIsBlocked) {
      var origin = new Cube(this.x, this.y, this.z);
      var visited = {};
      visited[origin.key()] = true;
      var border = new Array(n+1);
      border[0] = [origin];

      var neighbors = [], blocked = false;
      for (var i = 1; i < border.length; i++) {
        border[i] = [];
        for (var j = 0; j < border[i-1].length; j++) {
          neighbors = border[i-1][j].neighbors();
          for (var k = 0; k < neighbors.length; k++) {
            blocked = funcIsBlocked(neighbors[k]);
            if (!blocked && !visited.hasOwnProperty(neighbors[k].key())) {
              visited[neighbors[k].key()] = true;
              border[i].push(neighbors[k]);
            }
          }
        }
      }
      return border;
    }
  };


  var Hexagon = function (q, r) {
    this.q = q;
    this.r = r;
  };

  Hexagon.prototype = {
    key: function () {
      return "" + this.q + "," + this.r;
    },

    equals: function(hex) {
      return (this.q === hex.q && this.r === hex.r);
    },

    add: function(hex) {
      return new Hexagon(this.q + hex.q, this.r + hex.r);
    },

    substract: function(hex) {
      return new Hexagon(this.q - hex.q, this.r - hex.r);
    },

    scale: function(k) {
      return new Hexagon(this.q * k, this.r * k);
    },

    round: function () {
      return cubeToHex(hexToCube(this).round());
    },

    distanceTo: function(hex) {
      return hexToCube(this).distanceTo(hexToCube(hex));
    },

    lineTo: function (hex) {
      var result = hexToCube(this).lineTo(hexToCube(hex));
      for (var i = 0; i < result.length; i++) {
        result[i] = cubeToHex(result[i]);
      }
      return result;
    },

    neighbors: function () {
      var result = [];
      for (var i = 0; i < NEIGHBORS.HEX.length; i++) {
        result.push(this.add(NEIGHBORS.HEX[i]));
      }
      return result;
    },

    neighborsInRange: function (n) {
      var result = hexToCube(this).neighborsInRange(n);
      for (var i = 0; i < result.length; i++) {
        result[i] = cubeToHex(result[i]);
      }
      return result;
    },

    neighborsInRing: function (radius) {
      var result = hexToCube(this).neighborsInRing(radius);
      for (var i = 0; i < result.length; i++) {
        result[i] = cubeToHex(result[i]);
      }
      return result;
    },

    neighborsInReach: function (movement) {
      var result = hexToCube(this).neighborsInReach(movement);
      for (var i = 0; i < result.length; i++) {
        for (var j = 0; j < result[i].length; j++) {
          result[i][j] = cubeToHex(result[i][j]);
        }
      }
      return result;
    }
  };

  function hexToCube(hex) {
    return new Cube(hex.q, -hex.q-hex.r, hex.r);
  }

  function cubeToHex(cube) {
    return new Hexagon(cube.x, cube.z);
  }

  function defaultFillHexagon(hexagon) {
    return hexagon;
  }


  function Grid() {
    this.data = {}; // data is stored with a hash
    this.origin = {x: 0, y: 0};
    this._hexSize = {x: 0, y: 0};
    this._size = {x: 0, y: 0};
    this._layout = LAYOUT.POINTY;
    this.setHexSize(20, 20);
  }

  Grid.prototype = {
    setOrigin: function(x, y) {
      var a = parseFloat(x), b = parseFloat(y);
      if(!isNaN(a) && !isNaN(b)) {
        this.origin.x = a;
        this.origin.y = b;
      }
    },

    setHexSize: function(x, y) {
      var a = parseFloat(x), b = parseFloat(y);
      if(!isNaN(a) && !isNaN(b)) {
        this._hexSize.x = a;
        this._hexSize.y = b;
        this._size.x = a / this._layout.size.x;
        this._size.y = b / this._layout.size.y;
      }
    },

    setLayout: function(type) {
      if (type === "flat") {
        this._layout = LAYOUT.FLAT;
      }
      else if (type === "pointy") {
        this._layout = LAYOUT.POINTY;
      }
    },

    forEach: function (func) {
      var keys = Object.keys(this.data);
      var coord = null;
      for (var i = 0; i < keys.length; i++) {
        coord = keys[i].split(",");
        func(this.data[keys[i]], parseInt(coord[0]), parseInt(coord[1]));
      }
    },

    transform: function (func) {
      var keys = Object.keys(this.data);
      var coord = null;
      for (var i = 0; i < keys.length; i++) {
        coord = keys[i].split(",");
        this.data[keys[i]] = func(this.data[keys[i]], parseInt(coord[0]), parseInt(coord[1]));
      }
    },

    coordToHex: function(x, y) {
      var _x = (x - this.origin.x) / this._size.x;
      var _y = (y - this.origin.y) / this._size.y;
      var q = this._layout.b0 * _x + this._layout.b1 * _y;
      var r = this._layout.b2 * _x + this._layout.b3 * _y;
      return new Hexagon(q, r);
    },

    hexToCoord: function(hex) {
      return {
        x: (this._layout.f0 * hex.q + this._layout.f1 * hex.r) * this._size.x,
        y: (this._layout.f2 * hex.q + this._layout.f3 * hex.r) * this._size.y
      };
    },

    getHexagon: function (x, y) {
      var key = this.coordToHex(x, y).round().key();
      if (this.data.hasOwnProperty(key)) {
        return this.data[key];
      }
      return null;
    },

    filterHexagonList: function (hexList) {
      var result = [], key = "";
      for (var i = 0; i < hexList.length; i++) {
        key = hexList[i].key();
        if (this.data.hasOwnProperty(key)) {
          result.push(this.data[key]);
        }
      }
      return result;
    },

    getNeighbors: function (x, y) {
      var hex = this.coordToHex(x, y).round();
      return this.filterHexagonList(hex.neighbors());
    },

    getHexagonBetween: function (x1,y1, x2,y2) {
      var hex1 = this.coordToHex(x1, y1).round();
      var hex2 = this.coordToHex(x2, y2).round();
      return this.filterHexagonList(hex1.lineTo(hex2));
    },

    drawImages: function (context, funcGetImage) {
      var img = null;
      this.forEach(function (hex, q, r) {
        img = funcGetImage(hex, q, r);
        this.drawHexImage(context, {q: q, r: r}, img);
      }.bind(this));
    },

    drawShapes: function (context, funcDraw) {
      var center = null, coords = null;
      this.forEach(function (hex, q, r) {
        this.drawHexShape(context, hex);
        funcDraw(q, r, hex);
      }.bind(this));
    },

    drawHexImage: function (context, hex, image) {
      var center = this.hexToCoord(hex);
      var x = this.origin.x + center.x - this._hexSize.x*0.5;
      var y = this.origin.y + center.y - this._hexSize.y*0.5;
      var width = this._hexSize.x;
      var height = this._hexSize.y;
      context.drawImage(image, x, y, width, height);
    },

    drawHexShape: function (context, hex) {
      var center = this.hexToCoord(hex);
      var vertices = [], angle = 0, x = 0, y = 0;
      for (var i = 0; i < 6; i++) {
        angle = (this._layout.rotation + i*60) * Math.PI / 180;
        x = this.origin.x + center.x + this._size.x * Math.cos(angle);
        y = this.origin.y + center.y + this._size.y * Math.sin(angle);
        vertices.push({x: x, y: y});
      }
      context.beginPath();
      context.moveTo(vertices[0].x, vertices[0].y);
      for (var i = 1; i <= 6; i++) {
        context.lineTo(vertices[i % 6].x, vertices[i % 6].y);
      }
      context.closePath();
    }
  };


  function defaultNewHexagon(hexagon) {
    return hexagon;
  }

  var Generator = {
    parallelogram: function (qMin, rMin, qMax, rMax, funcNewHexagon) {
      var grid = new Grid();
      var f = typeof(funcNewHexagon) == "function" ? funcNewHexagon : newHexagon;
      var hex = null;
      for (var q = qMin; q <= qMax; q++) {
        for (var r = rMin; r <= rMax; r++) {
          hex = new Hexagon(q, r);
          grid.data[hex.key()] = f(hex);
        }
      }
      return grid;
    },

    diamond: function (qMin, sMin, qMax, sMax, funcNewHexagon) {
      var grid = new Grid();
      var f = typeof(funcNewHexagon) == "function" ? funcNewHexagon : newHexagon;
      var hex = null;
      for (var q = qMin; q <= qMax; q++) {
        for (var s = sMin; s <= sMax; s++) {
          hex = new Hexagon(q, -q-s);
          grid.data[hex.key()] = f(hex);
        }
      }
      return grid;
    },

    rectangleOdd: function (width, height, funcNewHexagon) {
      var grid = new Grid();
      var f = typeof(funcNewHexagon) == "function" ? funcNewHexagon : newHexagon;
      var hex = null;
      var halfWidth = Math.floor(width*0.5), halfHeight = Math.floor(height*0.5);
      var offset = 0;
      for (var r = -halfHeight; r < height - halfHeight; r++) {
        offset = r>>1;
        for (var q = -halfWidth-offset; q < width-halfWidth-offset; q++) {
          hex = new Hexagon(q, r);
          grid.data[hex.key()] = f(hex);
        }
      }
      return grid;
    },

    rectangleEven: function (width, height, funcNewHexagon) {
      var grid = new Grid();
      var f = typeof(funcNewHexagon) == "function" ? funcNewHexagon : newHexagon;
      var hex = null;
      var halfWidth = Math.floor(width*0.5), halfHeight = Math.floor(height*0.5);
      var offset = 0;
      for (var r = -halfHeight; r < height - halfHeight; r++) {
        offset = r>>1;
        for (var s = -halfWidth-offset; s < width-halfWidth-offset; s++) {
          hex = new Hexagon(-s-r, r);
          grid.data[hex.key()] = f(hex);
        }
      }
      return grid;
    },

    triangleUp: function (size, funcNewHexagon) {
      var grid = new Grid();
      var f = typeof(funcNewHexagon) == "function" ? funcNewHexagon : newHexagon;
      var hex = null;
      for (var r = 0; r >= -size; r--) {
        for (var q = -r; q <= size; q++) {
          hex = new Hexagon(q, r);
          grid.data[hex.key()] = f(hex);
        }
      }
      return grid;
    },

    triangleDown: function (size, funcNewHexagon) {
      var grid = new Grid();
      var f = typeof(funcNewHexagon) == "function" ? funcNewHexagon : newHexagon;
      var hex = null;
      for (var q = 0; q <= size; q++) {
        for (var r = 0; r <= size - q; r++) {
          hex = new Hexagon(q, r);
          grid.data[hex.key()] = f(hex);
        }
      }
      return grid;
    },

    hexagon: function (radius, funcNewHexagon) {
      var grid = new Grid();
      var f = typeof(funcNewHexagon) == "function" ? funcNewHexagon : newHexagon;
      var hex = null;
      var r1 = 0, r2 = 0;
      for (var q = -radius; q <= radius; q++) {
        r1 = Math.max(-radius, -q-radius);
        r2 = Math.min(radius, -q+radius);
        for (var r = r1; r <= r2; r++) {
          hex = new Hexagon(q, r);
          grid.data[hex.key()] = f(hex);
        }
      }
      return grid;
    }
  };

  return {
    Hexagon: Hexagon,
    Grid: Grid,
    Generator: Generator
  };
}));
