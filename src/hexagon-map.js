(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HexagonMap = factory();
  }
}(this, function () {
  "use strict";

  const LAYOUT = {
    FLAT: {
      f0: 1.5, f1: 0, f2: Math.sqrt(3) * 0.5, f3: Math.sqrt(3),
      b0: 2 / 3, b1: 0, b2: -1 / 3, b3: Math.sqrt(3) / 3,
      size: {x: 2, y: Math.sqrt(3)},
      // spacing: {x: 3/4, y: 1},
      rotation: 0
    },
    POINTY: {
      f0: Math.sqrt(3), f1: Math.sqrt(3) * 0.5, f2: 0, f3: 1.5,
      b0: Math.sqrt(3) / 3, b1: -1 / 3, b2: 0, b3: 2 / 3,
      size: {x: Math.sqrt(3), y: 2},
      // spacing: {x: 1, y: 3/4},
      rotation: 30
    }
  };

  const NEIGHBORS = {
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

  /**
   * Cube class, based on cubic coordinates (simple algorithm definition)
   */
  function Cube(x, y, z) {
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
      let rx = Math.round(this.x),
          ry = Math.round(this.y),
          rz = Math.round(this.z);
      let dx = Math.abs(rx - this.x),
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
      let dist = this.distanceTo(cube);
      let result = [], c = null;
      for (let i = 0; i <= dist; i++) {
        c = lerpCube(this, cube, i/dist);
        result.push(new Cube(c.x, c.y, c.z).round());
      }
      return result;
    },

    neighbors: function () {
      let result = [];
      for (let i = 0; i < NEIGHBORS.CUBIC.length; i++) {
        result.push(this.add(NEIGHBORS.CUBIC[i]));
      }
      return result;
    },

    neighborsInRange: function (range) {
      let result = [];
      let cube = null;
      for (let x = -range; x <= range; x++) {
        for (let y = Math.max(-range, -x-range); y <= Math.min(range, -x+range); y++) {
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
      let result = [];
      let cube = this.add(new Cube(1, -1, 0).scale(radius));
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
          result.push(cube);
          cube = cube.add(NEIGHBORS.CUBIC[i]);
        }
      }
      return result;
    },

    neighborsInReach: function (n) {
      let origin = new Cube(this.x, this.y, this.z);
      let visited = {};
      visited[origin.key()] = true;
      let border = new Array(n+1);
      border[0] = [origin];

      let neighbors = [], blocked = false;
      for (let i = 1; i < border.length; i++) {
        border[i] = [];
        for (let j = 0; j < border[i-1].length; j++) {
          neighbors = border[i-1][j].neighbors();
          for (let k = 0; k < neighbors.length; k++) {
            // !! IMPLEMENT BLOCKING LOGIC !!
            blocked = false;
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


  /**
    * Hexagon class, based on axial coordinates (easy to work with)
    */
  function Hexagon(q, r) {
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
      let result = hexToCube(this).lineTo(hexToCube(hex));
      for (let i = 0; i < result.length; i++) {
        result[i] = cubeToHex(result[i]);
      }
      return result;
    },

    neighbors: function () {
      let result = [];
      for (let i = 0; i < NEIGHBORS.HEX.length; i++) {
        result.push(this.add(NEIGHBORS.HEX[i]));
      }
      return result;
    },

    neighborsInRange: function (n) {
      let result = hexToCube(this).neighborsInRange(n);
      for (let i = 0; i < result.length; i++) {
        result[i] = cubeToHex(result[i]);
      }
      return result;
    },

    neighborsInRing: function (radius) {
      let result = hexToCube(this).neighborsInRing(radius);
      for (let i = 0; i < result.length; i++) {
        result[i] = cubeToHex(result[i]);
      }
      return result;
    },

    neighborsInReach: function (movement) {
      let result = hexToCube(this).neighborsInReach(movement);
      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result[i].length; j++) {
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

  /**
   * HexagonMap is a data container for Hexagon tiles, with an
   * interface for all Hexagon operations and for map creation
   */
  function HexagonMap() {
    this.origin = {x: 0, y: 0};
    this.tileSize = {x: 0, y: 0};
    this._size = {x: 0, y: 0};
    this._layout = LAYOUT.POINTY;
    this.data = {}; // data is stored with a hash
    this.setTileSize(20, 20);
  }

  HexagonMap.prototype = {
    setOrigin: function(x, y) {
      let a = parseFloat(x), b = parseFloat(y);
      if(!isNaN(a) && !isNaN(b)) {
        this.origin.x = a;
        this.origin.y = b;
      }
    },

    setTileSize: function(x, y) {
      let a = parseFloat(x), b = parseFloat(y);
      if(!isNaN(a) && !isNaN(b)) {
        this.tileSize.x = a;
        this.tileSize.y = b;
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

    create: function (type, dimensions, func) {
      this.data = {};
      switch (type) {
        case "parallelogram":
          this.data = createParallelogram(dimensions[0], dimensions[1], dimensions[2], dimensions[3]);
          break;
        case "diamond":
          this.data = createDiamond(dimensions[0], dimensions[1], dimensions[2], dimensions[3]);
          break;
        case "rectangle-odd":
          this.data = createRectangleOdd(dimensions[0], dimensions[1]);
          break;
        case "rectangle-even":
          this.data = createRectangleEven(dimensions[0], dimensions[1]);
          break;
        case "triangle-up":
          this.data = createTriangleUp(dimensions, func);
          break;
        case "triangle-down":
          this.data = createTriangleDown(dimensions, func);
          break;
        case "hexagon":
          this.data = createHexagon(dimensions, func);
          break;
      }

      if (typeof(func) !== "function") {
        func = function (q, r, hexagon) {
          return hexagon;
        }
      }
      this.fill(func);
    },

    fill: function (func) {
      let keys = Object.keys(this.data);
      let coord = null;
      for (let i = 0; i < keys.length; i++) {
        coord = keys[i].split(",");
        this.data[keys[i]] = func(coord[0], coord[1], this.data[keys[i]]);
      }
    },

    forEach: function (func) {
      let keys = Object.keys(this.data);
      let coord = null;
      for (let i = 0; i < keys.length; i++) {
        coord = keys[i].split(",");
        func(coord[0], coord[1], this.data[keys[i]]);
      }
    },

    coordToHex: function(x, y) {
      let _x = (x - this.origin.x) / this._size.x;
      let _y = (y - this.origin.y) / this._size.y;
      let q = this._layout.b0 * _x + this._layout.b1 * _y;
      let r = this._layout.b2 * _x + this._layout.b3 * _y;
      return new Hexagon(q, r);
    },

    hexToCoord: function(hex) {
      return {
        x: (this._layout.f0 * hex.q + this._layout.f1 * hex.r) * this._size.x,
        y: (this._layout.f2 * hex.q + this._layout.f3 * hex.r) * this._size.y
      };
    },

    getHexagon: function (x, y) {
      let key = this.coordToHex(x, y).round().key();
      if (key in this.data) {
        return this.data[key];
      }
      return null;
    },

    filterHexagonList: function (hexList) {
      let result = [], key = "";
      for (let i = 0; i < hexList.length; i++) {
        key = hexList[i].key();
        if (key in this.data) {
          result.push(this.data[key]);
        }
      }
      return result;
    },

    getNeighbors(x, y) {
      let hex = this.coordToHex(x, y).round();
      return this.filterHexagonList(hex.neighbors());
    },

    getHexagonBetween: function(x1,y1, x2,y2) {
      let hex1 = this.coordToHex(x1, y1).round();
      let hex2 = this.coordToHex(x2, y2).round();
      return this.filterHexagonList(hex1.lineTo(hex2));
    },

    drawImages: function (ctx, imageFunc) {
      let img = null;
      this.forEach(function (q, r, hex) {
        img = imageFunc(q, r, hex);
        this.drawHexImage(ctx, {q: q, r: r}, img);
      }.bind(this));
    },

    drawShapes: function (ctx, styleFunc) {
      let center = null, coords = null;
      this.forEach(function (q, r, hex) {
        this.drawHexShape(ctx, hex);
        styleFunc(q, r, hex);
      }.bind(this));
    },

    drawHexImage: function (ctx, hex, image) {
      let center = this.hexToCoord(hex);
      let x = this.origin.x + center.x - this.tileSize.x*0.5;
      let y = this.origin.y + center.y - this.tileSize.y*0.5;
      let width = this.tileSize.x;
      let height = this.tileSize.y;
      console.log(x, y, width, height);
      ctx.drawImage(image, x, y, width, height);
    },

    drawHexShape: function (ctx, hex) {
      let center = this.hexToCoord(hex);
      let vertices = [], angle = 0, x = 0, y = 0;
      for (let i = 0; i < 6; i++) {
        angle = (this._layout.rotation + i*60) * Math.PI / 180;
        x = this.origin.x + center.x + this._size.x * Math.cos(angle);
        y = this.origin.y + center.y + this._size.y * Math.sin(angle);
        vertices.push({x: x, y: y});
      }
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i <= 6; i++) {
        ctx.lineTo(vertices[i % 6].x, vertices[i % 6].y);
      }
      ctx.closePath();
    }
  };

  /**
   * Map creation functions
   */

  function createParallelogram(qMin, qMax, rMin, rMax) {
    let data = {}, hex = null;
    for (let q = qMin; q <= qMax; q++) {
      for (let r = rMin; r <= rMax; r++) {
        hex = new Hexagon(q, r);
        data[hex.key()] = hex;
      }
    }
    return data;
  }

  function createDiamond(qMin, qMax, sMin, sMax) {
    let data = {}, hex = null;
    for (let q = qMin; q <= qMax; q++) {
      for (let s = sMin; s <= sMax; s++) {
        hex = new Hexagon(q, -q-s);
        data[hex.key()] = hex;
      }
    }
    return data;
  }

  function createRectangleOdd(width, height) {
    let data = {}, hex = null;
    let halfWidth = Math.floor(width*0.5), halfHeight = Math.floor(height*0.5);
    let offset = 0;
    for (let r = -halfHeight; r < height - halfHeight; r++) {
      offset = r>>1;
      for (let q = -halfWidth-offset; q < width-halfWidth-offset; q++) {
        hex = new Hexagon(q, r);
        data[hex.key()] = hex;
      }
    }
    return data;
  }

  function createRectangleEven(width, height) {
    let data = {}, hex = null;
    let halfWidth = Math.floor(width*0.5), halfHeight = Math.floor(height*0.5);
    let offset = 0;
    for (let r = -halfHeight; r < height - halfHeight; r++) {
      offset = r>>1;
      for (let s = -halfWidth-offset; s < width-halfWidth-offset; s++) {
        hex = new Hexagon(-s-r, r);
        data[hex.key()] = hex;
      }
    }
    return data;
  }

  function createTriangleUp(size) {
    let data = {}, hex = null;
    for (let r = 0; r >= -size; r--) {
      for (let q = -r; q <= size; q++) {
        hex = new Hexagon(q, r)
        data[hex.key()] = hex;
      }
    }
    return data;
  }

  function createTriangleDown(size) {
    let data = {}, hex = null;
    for (let q = 0; q <= size; q++) {
      for (let r = 0; r <= size - q; r++) {
        hex = new Hexagon(q, r);
        data[hex.key()] = hex;
      }
    }
    return data
  }

  function createHexagon(radius) {
    let data = {}, hex = null;
    let r1 = 0, r2 = 0;
    for (let q = -radius; q <= radius; q++) {
      r1 = Math.max(-radius, -q-radius);
      r2 = Math.min(radius, -q+radius);
      for (let r = r1; r <= r2; r++) {
        hex = new Hexagon(q, r);
        data[hex.key()] = hex;
      }
    }
    return data;
  }

  return HexagonMap;
}));
