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

  const layoutPointy = {
    f0: Math.sqrt(3), f1: Math.sqrt(3) * 0.5, f2: 0, f3: 1.5,
    b0: Math.sqrt(3) / 3, b1: -1 / 3, b2: 0, b3: 2 / 3,
    angle: 30,
    size: {x: 0.5*Math.sqrt(3), y: 1}
  };

  const layoutFlat = {
    f0: 1.5, f1: 0, f2: Math.sqrt(3) * 0.5, f3: Math.sqrt(3),
    b0: 2 / 3, b1: 0, b2: -1 / 3, b3: Math.sqrt(3) / 3,
    angle: 0,
    size: {x: 1, y: 0.5*Math.sqrt(3)}
  };

  const axial_neigbhors = [
    {q: 1, r: 0}, {q: 1, r: -1}, {q: 0, r: -1},
    {q: -1, r: 0}, {q: -1, r: 1}, {q: 0, r: 1}
  ];

  const cube_neighbors = [
    {x: 1, y: -1, z: 0}, {x: 1, y: 0, z: -1}, {x: 0, y: 1, z: -1},
    {x: -1, y: 1, z: 0}, {x: -1, y: 0, z: 1}, {x: 0, y: -1, z: 1}
  ];

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function cube_lerp(a, b, t) {
    return new Cube(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
  }

  /**
   * Hexagon class, based on axial coordinates (easy to work with)
   */
  function Hexagon(q, r) {
    this.q = q;
    this.r = r;
  };

  Hexagon.prototype = {
    key: function () {
      return "" + this.q + this.r;
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
      for (let i = 0; i < axial_neigbhors.length; i++) {
        result.push(this.add(axial_neigbhors[i]));
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
        result[i] = cubeToHex(result[i]);
      }
      return result;
    }
  }

  /**
   * Cube class, based on cubic coordinates (easy algorithm definition)
   */
  function Cube(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  };

  Cube.prototype = {
    key: function () {
      return "" + this.x + this.y + this.z;
    },

    equals: function(cube) {
      return (this.x === cube.x && this.y === cube.y && this.z === cube.z);
    },

    add: function(cube) {
      return new Cube(this.x + cube.x, this.y + cube.y, this.z + cube.z);
    },

    substract: function(cube) {
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
      else{
        rz = - rx - ry;
      }
      return new Cube(rx, ry, rz);
    },

    distanceTo: function (cube) {
      return 0.5 * (Math.abs(this.x-cube.x) + Math.abs(this.y-cube.y) + Math.abs(this.z-cube.z));
    },

    lineTo: function (cube) {
      let dist = this.distanceTo(cube);
      let result = [];
      for (let i = 0; i <= N; i++) {
        result.push(Cube.round(cube_lerp(this, cube, i/N)));
      }
      return result;
    },

    neighbors: function () {
      let result = [];
      for (let i = 0; i < cube_neighbors.length; i++) {
        result.push(this.add(cube_neighbors[i]));
      }
      return result;
    },

    neighborsInRange: function (n) {
      let result = [];
      for (let x = -n; x <= n; x++) {
        for (let y = Math.max(n, -x-n); y <= Math.min(n, -x+n); y++) {
          result.push(new Cube(x, y, -x-y));
        }
      }
      return result;
    },

    neighborsInRing: function (radius) {
      if (radius == 0) return this;

      let result = [];
      let cube = this.add(new Cube(1, -1, 0).scale(radius));
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
          result.push(cube);
          cube = cube.add(cube_neighbors[i]);
        }
      }
      return result;
    },

    neighborsInReach: function (movement) {
      let visited = {}, // keys of visited cube
          border = new Array(movement+1); // array of array of cube
      visited.push(this);
      border[0] = [new Cube(this)];

      let neighbors = [], cube = null, blocked = false;
      for (let i = 1; i <= movement; i++) {
        border[i] = [];
        for(let j = 0; j < border[i-1].length; j++) {
          neighbors = border[i-1][j].neighbors();
          for(cube of neighbors) {
            blocked = false // !! implement blocking logic !!
            if (!cube.key() in visited && !blocked) {
              visited[cube.key()] = true;
              border[i].push(cube);
            }
          }
        }
      }
    }
  }

  function hexToCube(hex) {return new Cube(hex.q, -hex.q-hex.r, hex.r)}
  function cubeToHex(cube) {return new Hexagon(cube.x, cube.z)}

  /**
   * HexagonMap is the data container for all Hexagon
   * It is an interface for all Hexagon operations and for map creation
   */
  var HexagonMap = function() {
    this.layout = layoutPointy;

    this.origin = {x: 0, y: 0};
    this.size_x;
    this.size_y;
    this.hex_width;
    this.hex_height;

    this.data = {}; // data container

    this.setTileDimensions(20, 20)
  }

  HexagonMap.prototype = {
    setLayout: function(type) {
      if (type === "flat") {
        this.layout = layoutFlat;
      }
      else if (type === "pointy") {
        this.layout = layoutPointy;
      }
    },

    setOrigin: function(x, y) {
      if(!isNaN(parseInt(x))) {
        this.origin.x = parseInt(x);
      }
      if(!isNaN(parseInt(y))) {
        this.origin.y = parseInt(y);
      }
    },

    setTileDimensions: function(x, y) {
      if(!isNaN(parseInt(x))) {
        this.size_x = parseInt(x);
        this.hex_width = this.size_x * this.layout.size.x;
      }
      if(!isNaN(parseInt(y))) {
        this.size_y = parseInt(y);
        this.hex_height = this.size_y * this.layout.size.y;
      }
    },

    create: function(map_type, dimensions, func) {
      if(typeof(func) !== "function") {
        func = function (hex) {return hex}
      }

      switch (map_type) {
        case "parallelogram":
        this.data = createParallelogram(dimensions, func);
        break;
        case "diamond":
        this.data = createDiamond(dimensions, func);
        break;
        case "rectangle_odd":
        this.data = createRectangleOdd(dimensions, func);
        break;
        case "rectangle_even":
        this.data = createRectangleEven(dimensions, func);
        break;
        case "triangle_top":
        this.data = createTriangleTop(dimensions, func);
        break;
        case "triangle_down":
        this.data = createTriangleDown(dimensions, func);
        break;
        case "hexagon":
        this.data = createHexagon(dimensions, func);
        break;
      }
    },

    getHexagon: function (x, y) {
      let key = this.coordToHex({x: x, y: y}).round().key();
      if(key in this.data) {
        return this.data[key];
      }
      return null;
    },

    getNeighbors(hex) {
      if (!!hex) {
        return this.filterHexagonList(hex.neighbors());
      }
      return null;
    },

    getHexagonBetween: function(x1,y1, x2,y2) {
      let hex1 = this.coordToHex({x: x1, y: y1}).round();
      let hex2 = this.coordToHex({x: x2, y: y2}).round();
      return this.filterHexagonList(hex1.lineTo(hex2));
    },

    filterHexagonList: function (hex_list) {
      let result = [], key = "";
      for (var i = 0; i < hex_list.length; i++) {
        key = hex_list[i].key();
        if(key in this.data) {
          result.push(this.data[key]);
        }
      }
      return result;
    },

    hexToCoord: function(hex) {
      return {
        x:  ((this.layout.f0 * hex.q ) + (this.layout.f1 * hex.r)) * this.size_x,
        y: ((this.layout.f2 * hex.q) + (this.layout.f3 * hex.r)) * this.size_y
      };
    },

    coordToHex: function(coord) {
      let x  = (coord.x - this.origin.x) / this.size_x;
      let y  = (coord.y - this.origin.y) / this.size_y;
      let q = (this.layout.b0 * x) + (this.layout.b1 * y);
      let r = (this.layout.b2 * x) + (this.layout.b3 * y);
      return new Hexagon(q, r);
    },

    draw: function(ctx) {
      let keys = Object.keys(this.data);
      for (let i = 0; i < keys.length; i++) {
        this.drawHex(ctx, this.data[keys[i]]);
      }
    },

    drawHex: function(ctx, hex) {
      let center = this.hexToCoord(hex);
      let coordinates = {
        x: this.origin.x + center.x,
        y: this.origin.y + center.y
      }

      if (hex.image) {  // use the 'img' property of hexagon to draw an image
        ctx.drawImage(hex.image, coordinates.x-this.hex_width, coordinates.y-this.hex_height, this.hex_width*2, this.hex_height*2);
      }
      else {
        let corner = [], angle = 0, x = 0, y = 0;
        for (let i = 0; i < 6; i++) {
          angle = Math.PI * (this.layout.angle + i*60) / 180;
          x = coordinates.x +  this.size_x * Math.cos(angle);
          y = coordinates.y +  this.size_y * Math.sin(angle);
          corner.push({x: x, y: y});
        }

        ctx.beginPath();
        ctx.moveTo(corner[0].x, corner[0].y);
        for (let i = 1; i <= 6; i++) {
          ctx.lineTo(corner[i % 6].x, corner[i % 6].y);
        }
        ctx.stroke();
      }
    }
  }

  /**
   * Map creation functions
   */

  function createParallelogram(dimensions, func) {
    let q1 = dimensions[0], q2 = dimensions[1], r1 = dimensions[2], r2 = dimensions[3];
    let data = {}, hex = null;

    for (let q = q1; q <= q2; q++) {
      for (let r = r1; r <= r2; r++) {
        hex = new Hexagon(q, r);
        data[hex.key()] = func(hex);
      }
    }
    return data;
  }

  function createDiamond(dimensions, func) {
    let q1 = dimensions[0], q2 = dimensions[1], s1 = dimensions[2], s2 = dimensions[3];
    let data = {}, hex = null;

    for (let q = q1; q <= q2; q++) {
      for (let s = s1; s <= s2; s++) {
        hex = new Hexagon(q, -q-s);
        data[hex.key()] = func(hex);
      }
    }
    return data;
  }

  function createRectangleOdd(dimensions, func) {
    let width = dimensions[0], height = dimensions[1];
    let data = {}, hex = null;

    let offset = 0, h_width = Math.floor(width*0.5), h_height = Math.floor(height*0.5);
      for (let r = -h_height; r < height - h_height; r++) {
        offset = r>>1;
        for (let q = -h_width-offset; q < width-h_width-offset; q++) {
          hex = new Hexagon(q, r);
          data[hex.key()] = func(hex);
        }
      }
    return data;
  }

  function createRectangleEven(dimensions, func) {
    let width = dimensions[0], height = dimensions[1];
    let data = {}, hex = null;

    let offset = 0, h_width = Math.floor(width*0.5), h_height = Math.floor(height*0.5);
    for (let r = -h_height; r < height - h_height; r++) {
      offset = r>>1;
      for (let s = -h_width-offset; s < width-h_width-offset; s++) {
        hex = new Hexagon(-s-r, r);
        data[hex.key()] = func(hex);
      }
    }
  return data;
  }

  function createTriangleTop(dimensions, func) {
    let size = dimensions;
    let data = {}, hex = null;

    for (let r = 0; r >= -size; r--) {
      for (let q = -r; q <= size; q++) {
        hex = new Hexagon(q, r);
        data[hex.key()] = func(hex);
      }
    }
    return data;
  }

  function createTriangleDown(dimensions, func) {
    let size = dimensions;
    let data = {}, hex = null;

    for (let q = 0; q <= size; q++) {
      for (let r = 0; r <= size - q; r++) {
        hex = new Hexagon(q, r);
        data[hex.key()] = func(hex);
      }
    }
    return data
  }

  function createHexagon(dimensions, func) {
    let radius = dimensions, r1 = 0, r2 = 0;
    let data = {}, hex = null;

    for (let q = -radius; q <= radius; q++) {
      r1 = Math.max(-radius, -q-radius);
      r2 = Math.min(radius, -q+radius);
      for (let r = r1; r <= r2; r++) {
        hex = new Hexagon(q, r);
        data[hex.key()] = func(hex);
      }
    }
    return data;
  }

  return HexagonMap;
}));
