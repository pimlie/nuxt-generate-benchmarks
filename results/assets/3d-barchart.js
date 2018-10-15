import * as d3lib from 'd3'
import * as d33d from 'd3-3d'

let d3
if (process.client) {
  d3 = Object.assign(d3lib, d33d)
}

const defaultOptions = {
  origin: [ 0, 0 ],
  scale: 20,
  alpha: 0,
  beta: 0,
  startAngle: Math.PI / 6,
  colorRange: ["#A6CEE3", "#B2DF8A", "#FDBF6F", "#FFFF99", "#FB9A99"],
  transitionDuration: 1000
}

export default class Barchart3D {
  constructor(elementId, options) {
    this.elementId = elementId
    this.options = Object.assign(defaultOptions, options)


    this.svg
    this.cubesGroup
    this.dragCoords = {}
    this.data
  }

  static makeCube(h, x, z) {
    return [
      {x: x - 1, y: h, z: z + 1}, // FRONT TOP LEFT
      {x: x - 1, y: 0, z: z + 1}, // FRONT BOTTOM LEFT
      {x: x + 1, y: 0, z: z + 1}, // FRONT BOTTOM RIGHT
      {x: x + 1, y: h, z: z + 1}, // FRONT TOP RIGHT
      {x: x - 1, y: h, z: z - 1}, // BACK  TOP LEFT
      {x: x - 1, y: 0, z: z - 1}, // BACK  BOTTOM LEFT
      {x: x + 1, y: 0, z: z - 1}, // BACK  BOTTOM RIGHT
      {x: x + 1, y: h, z: z - 1}, // BACK  TOP RIGHT
    ]
  }

  setOption(option, value) {
    if (defaultOptions[option] === undefined) {
      throw new Error(`Unknown option ${option}`)
    }
    this.options[option] = value
  }

  initiate() {
    this.colors = d3.scaleLinear()
      .domain(this.options.colorRange.map((v, idx) => {
        return idx / this.options.colorRange.length
      }))
      .range(this.options.colorRange)

    this.reversedColors = d3.scaleLinear()
      .domain(this.options.colorRange.map((v, idx) => {
        return idx / this.options.colorRange.length
      }))
      .range(this.options.colorRange.reverse())

    this.svg = d3.select('svg')
      .call(
        d3.drag()
          .on('drag', this.dragged.bind(this))
          .on('start', this.dragStart.bind(this))
          .on('end', this.dragEnd.bind(this))
      ).append('g')

    this.axesGroup = this.svg.append('g').attr('class', 'axes')
    this.cubesGroup = this.svg.append('g').attr('class', 'cubes')

    this.cubes3D = d3._3d()
      .shape('CUBE')
      .x(d => d.x)
      .y(d => d.y)
      .z(d => d.z)
      .rotateY(this.options.startAngle)
      .rotateX(-this.options.startAngle)
      .origin(this.options.origin)
      .scale(this.options.scale)
    
    this.lines3D = d3._3d()
      .shape('LINE')
      .x(d => d.x)
      .y(d => d.y)
      .z(d => d.z)
      .rotateY(this.options.startAngle)
      .rotateX(-this.options.startAngle)
      .origin(this.options.origin)
      .scale(this.options.scale)
  }

  dragStart() {
    this.dragCoords.x = d3.event.x;
    this.dragCoords.y = d3.event.y;
  }

  dragged() {
    this.dragCoords.mouseX = this.dragCoords.mouseX || 0;
    this.dragCoords.mouseY = this.dragCoords.mouseY || 0;
    this.options.beta  = (d3.event.x - this.dragCoords.x + this.dragCoords.mouseX) * Math.PI / 230 ;
    this.options.alpha = (d3.event.y - this.dragCoords.y + this.dragCoords.mouseY) * Math.PI / 230  * (-1);
    this.draw(this.cubes3D.rotateY(this.options.beta + this.options.startAngle).rotateX(this.options.alpha - this.options.startAngle)(this.data), 0)
    this.drawAxes(this.lines3D.rotateY(this.options.beta + this.options.startAngle).rotateX(this.options.alpha - this.options.startAngle)(this.axesData))
  }

  dragEnd() {
    this.dragCoords.mouseX = d3.event.x - this.dragCoords.x + this.dragCoords.mouseX;
    this.dragCoords.mouseY = d3.event.y - this.dragCoords.y + this.dragCoords.mouseY;
  }

  getColor(value) {
    if (value <= 0) {
      return this.colors(-value)
    } else {
      return this.reversedColors(value)
    }
  }

  setupAxes({ xTickLabels, zTickLabels, space, step }) {
    const data = []

    const posX = -1 * (xTickLabels.length / 2 - 1) * step - space
    const posZ = (zTickLabels.length / 2) * step + space

    /* Setup X-Axis */
    let startIndex = -1 * (xTickLabels.length / 2 - 1)
    if (space) {
      const segment = [
        { x: startIndex * step - space, y: 0, z: posZ },
        { x: startIndex * step - 0.5 * step, y: 0, z: posZ }
      ]
      segment.id = 'x-axis-space'
      data.push(segment)
    }
    for (let index in xTickLabels) {
      const segment = [
        { x: startIndex * step - 0.5 * step, y: 0, z: posZ },
        { x: ++startIndex * step - 0.5 * step, y: 0, z: posZ }
      ]
      segment.id = 'x-axis-' + index
      segment.label = xTickLabels[index]
      data.push(segment)
    }

    /* Setup Z-Axis */
    startIndex = -1 * zTickLabels.length / 2
    for (let index in zTickLabels) {
      const segment = [
        { x: posX, y: 0, z: startIndex * step + 0.5 * step },
        { x: posX, y: 0, z: ++startIndex * step + 0.5 * step }
      ]
      segment.id = 'z-axis-' + index
      segment.label = zTickLabels[index]
      data.push(segment)
    }
    if (space) {
      const segment = [
        { x: posX, y: 0, z: startIndex * step + 0.5 * step },
        { x: posX, y: 0, z: startIndex * step + space }
      ]
      segment.id = 'z-axis-space'
      data.push(segment)
    }

    this.drawAxes(data)
  }

  drawAxes(data) {
    this.axesData = this.lines3D(data)

    const axes = this.axesGroup.selectAll('g.axis').data(this.axesData, (d) => { return d.id })
    const ae = axes
      .enter()
      .append('g')
      .attr('class', 'axis')
      .attr('fill-opacity', 0.8)
      .merge(axes)
      .sort(this.lines3D.sort)

    axes.exit().remove()
    
    const segments = axes.merge(ae).selectAll('line.segment').data((d) => [d])
    segments
      .enter()
      .append('line')
      .attr('class', 'segment')
      .attr('fill-opacity', 0.8)
      .classed('_3d', true)
      .merge(segments)
      .attr('fill', '#999')
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('x1', d => d[0].projected.x )
      .attr('y1', d => d[0].projected.y )
      .attr('x2', d => d[1].projected.x )
      .attr('y2', d => d[1].projected.y )
      .sort(this.lines3D.sort)

    segments.exit().remove()

    const ticks = axes.merge(ae).selectAll('text.tick').data((d, index, elements) => {
      return [{
          label: d.label,
          centroid: d.centroid
        }]
    })
    ticks
      .enter()
      .append('text')
      .attr('class', 'tick')
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'sans-serif')
      .attr('font-weight', 'bolder')
      .classed('_3d', true)
      .merge(ticks)
      .attr('fill-opacity', 0.8)
      .attr('fill', '#999')
      .attr('stroke', 'none')
      .attr('x', d => this.options.origin[0] + this.options.scale * (d.centroid.x))
      .attr('y', d => this.options.origin[1] + this.options.scale * (d.centroid.y))
      .text(d => d.label)
    ticks.exit().remove()
    
    ae.selectAll('._3d').sort(d3._3d().sort)
  }

  draw(data, transitionDuration) {
    if (transitionDuration === undefined) {
      transitionDuration = this.options.transitionDuration
    }

    this.data = this.cubes3D(data)
    const cubes = this.cubesGroup.selectAll('g.cube').data(this.data, (d) => { return d.id })

    /* --------- CUBES ---------*/
    const ce = cubes
        .enter()
        .append('g')
        .attr('class', 'cube')
        .attr('fill-opacity', 0.8)
        .merge(cubes)
        .attr('fill', d => this.getColor(d.valueFactor))
        .attr('stroke', d => d3.color(this.getColor(d.valueFactor)).darker(0.3))
        .sort(this.cubes3D.sort)

    cubes.exit().remove()

    /* --------- FACES ---------*/

    const faces = cubes.merge(ce).selectAll('path.face').data(d => d.faces, d => d.face)

    faces.enter()
        .append('path')
        .attr('class', 'face')
        .attr('fill-opacity', 0.5)
        .classed('_3d', true)
        .merge(faces)
        .transition().duration(transitionDuration)
        .attr('d', this.cubes3D.draw);

    faces.exit().remove()
  
    /* --------- TEXT ---------*/
    const texts = cubes.merge(ce).selectAll('text.text').data((d) => {
        const _t = d.faces.filter((d) => { return d.face === 'top' })
        return [{
          value: d.value,
          precision: d.precision,
          centroid: _t[0].centroid
        }]
    })

    texts
      .enter()
      .append('text')
      .attr('class', 'text')
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'sans-serif')
      .attr('font-weight', 'bolder')
      .attr('x', d => this.options.origin[0] + this.options.scale * d.centroid.x)
      .attr('y', d => this.options.origin[1] + this.options.scale * d.centroid.y)
      .classed('_3d', true)
      .merge(texts)
      .transition().duration(transitionDuration)
      .attr('fill', '#444')
      .attr('stroke', 'none')
      .attr('x', d => this.options.origin[0] + this.options.scale * d.centroid.x)
      .attr('y', d => this.options.origin[1] + this.options.scale * d.centroid.y)
      .tween('text', (d, index, elements) => {
        const that = d3.select(elements[index]);
        if (d.value === undefined) {
          return () => that.text('')
        } else {
          const currentText = that.text()
          if (currentText === '') {
            return () => that.text(Math.abs(d.value).toFixed(d.precision))
          } else {
            const i = d3.interpolateNumber(+that.text(), Math.abs(d.value))
            return (t) => {
              return that.text(i(t).toFixed(d.precision))
            }
          }
        }
      })

    texts.exit().remove()

    /* --------- SORT TEXT & FACES ---------*/
    ce.selectAll('._3d').sort(d3._3d().sort)
  }
}
