let theShader
let w, h
let defendingPositions = []
let defenders = []
let vacancies = []
let lastReplenishment = -10000
let flock
let destinationSet = []
let gun_sound
let rooster_sound
let wolf_sound
let explosion_sound
let gunFires = []
let machinegunFires = []
let explosions = []
let enermyUpLimit = 60
let teams = []
let lightX
let lightY
let lightD_init = 100
let lightD
let lightD_wave
let lightMoveSpeed_init = 2
let lightMoveSpeed
let lightPosition
let lightD_inc = 1.3
let lightMoveSpeed_inc = 1.69
let lightHeading
let enermySpeed = 2.0
let defenderSpeed = 4.0
let ctgs_invisible = 0.3
let ctgs_visible = 0.9
let ctgs_defender = 0.1
let lastReinforce = 0
let reinforceInterval = 200
let replenishInterval = 1000
let deathEffects = []
let Balance = 0.5
let replenishments = []
let LBTP = 0.0 // Last Balance Time Point
let lastInteraction = 0.0
let DN = 1 // 0 for day, 1 for night
let lastDN = 0
let twilight
let dayCount = 0

let gene_pool
let mutation_rate = 0.1
let evasion_probability = 0.5
let separation_probability = 0.5

let temp = 1.0
let tempArray = []
let tempCount = 0

let timePoint
let boid_id = 0

function preload() {
  // theShader = loadShader('shader.vert', 'shader.frag')

  gun_sound = loadSound('assets/gun_sound.mp3')
  // https://freesound.org/people/TheNikonProductions/sounds/337698/
  gun_sound.setVolume(0.1)
  gun_sound.rate(1.5)
  machinegun_sound = loadSound('assets/machinegun_sound.mp3')
  // https://freesound.org/people/pgi/sounds/212608/
  machinegun_sound.setVolume(0.02)
  machinegun_sound.rate(2)
  rooster_sound = loadSound('assets/rooster_sound.mp3')
  // https://freesound.org/people/AGFX/sounds/43382/
  rooster_sound.rate(2)
  rooster_sound.setVolume(0.5)
  wolf_sound = loadSound('assets/wolf_sound.mp3')
  // https://freesound.org/people/Zarry/sounds/178580/
  wolf_sound.rate(1.5)
  wolf_sound.setVolume(0.5)
  explosion_sound = loadSound('assets/explosion_sound.mp3')
  // https://freesound.org/people/derplayer/sounds/587194/
  explosion_sound.rate(1.5)
  explosion_sound.setVolume(0.1)
}

function setup() {
  createCanvas(windowWidth, windowHeight)
  colorMode('hsb', 100)
  ellipseMode(CENTER)
  rectMode(CENTER)
  textAlign(CENTER)
  w = width / 100
  h = height / 100
  destinationSet = [
    new destination(width*0.5-18*h*sin(PI/24),0.69*height-18*h*cos(PI/24), width*0.5+18*h*sin(PI/24),0.69*height+18*h*cos(PI/24)),
    new destination(width*0.2,0.73*height-18*h, width*0.2,0.73*height+18*h),
    new destination(width*0.8,0.66*height-18*h, width*0.8,0.66*height+18*h)
  ]
  
  flock = new Flock()
  
  defendingPositions = [[width*0.5+18*h*sin(PI/24),0.69*height+18*h*cos(PI/24)], [width*0.2,0.73*height+18*h], [width*0.8,0.66*height+18*h], [width*0.07-3*h*sin(PI/24),0.79*height+3*h*cos(PI/24)], [width*0.36-3*h*sin(-PI/24),0.80*height+3*h*cos(-PI/24)], [width*0.66-3*h*sin(-PI/36),0.74*height+3*h*cos(-PI/36)], [width*0.93-3*h*sin(PI/24),0.76*height+3*h*cos(PI/24)]]

  for(let i=0;i<defendingPositions.length;i++){
    defenders.push(new Defender(i))
  }
  lightX = width / 2
  lightY = height / 2
  lightHeading = createVector(0,0)
  wolf_sound.play()
  timePoint = millis()
}

function draw() {

  let daytime = 60000

  if(millis() % daytime <= daytime - 10000) {
    lastDN = DN
    DN = 1
    if(lastDN == 0 && DN == 1) {
      wolf_sound.play()
      for(let i=flock.boids.length-1;i>-1;i--) {
        if(i%2==1) {
          flock.boids.splice(i, 1)
        }
      }
    }
    if(millis() % daytime <= 3000) {
      twilight = 100 * (1 - ((millis() % daytime) / 3000)) ** 2
    }
  } else {
    lastDN = DN
    DN = 0
    if(lastDN == 1 && DN == 0) {
      rooster_sound.play()   
      dayCount ++
    }
    if(millis() % daytime <= daytime - 7000) {
      twilight = 100 * ((millis() % daytime - daytime + 10000) / 3000) ** 0.5
    }
    lightD_wave = dayCount -1 + (((millis() % daytime) - (daytime - 10000)) % 1000) / 1000
  }
  if(DN==0) {
    lightD = lightD_init * lightD_inc ** lightD_wave
  } else {
    lightD = lightD_init * lightD_inc ** dayCount
  }
  
  lightMoveSpeed = lightMoveSpeed_init * lightMoveSpeed_inc ** dayCount


  if(millis()-LBTP>10000){
    for(let i=replenishments.length-1;i>-1;i--) {
      if(millis()-replenishments[i]>10000) {
        replenishments.splice(i, 1)
      }
    }
    LBTP = millis()
    Balance = replenishments.length / (10000 / replenishInterval)
  }
  
  fill(100, 0, 0, 100 - twilight)
  rect(width/2,height/2,width,height)
  erase()
  circle(lightX, lightY, lightD)
  lightPosition = createVector(lightX, lightY)

  noErase()
  noStroke()
  fill(30,60,60, 30)
  rect(width/2,height/2,width,height)
  fill(60,60,60, 30)
  beginShape();
  curveVertex(0,0.65*height);
  curveVertex(0,0.65*height);
  curveVertex(0.25*width,0.68*height);
  curveVertex(0.5*width,0.65*height);
  curveVertex(0.75*width,0.62*height);
  curveVertex(width,0.65*height);
  curveVertex(width,0.73*height);
  curveVertex(0.75*width,0.70*height);
  curveVertex(0.5*width,0.73*height);
  curveVertex(0.25*width,0.78*height);
  curveVertex(0,0.73*height);
  curveVertex(0,0.73*height);
  endShape();
  
  drawBridges()
  drawSandbagBases()
  drawDefenders()
  drawDeathEffects()
  if(lastInteraction==0.0 && millis()-lastInteraction>3000){
    drawHints()
  }
  flock.run()
  let duration_s = 5
  let duration_i = duration_s
  for(let i=gunFires.length-1;i>-1;i--) {
    duration_i = duration_s * random(0.5,1) * gunFires[i].distance / 200
    if(gunFires[i].lifetime<duration_i) {
      gunFires[i].run()
    } else {
      gunFires.splice(i, 1)
    }
  }
  for(let i=explosions.length-1;i>-1;i--) {
    if(explosions[i].lifetime<60) {
      explosions[i].run()
    } else {
      explosions.splice(i, 1)
    }
  }
  let lightHeadingX = 0
  let lightHeadingY = 0
  if(keyIsDown(68) && lightX<=width){
    lightX += lightMoveSpeed
    lastInteraction = millis()
    lightHeadingX++
  }
  if(keyIsDown(65) && lightX>=0){
    lightX -= lightMoveSpeed
    lastInteraction = millis()
    lightHeadingX--
  }
  if(keyIsDown(87) && lightY>=0){
    lightY -= lightMoveSpeed
    lastInteraction = millis()
    lightHeadingY--
  }
  if(keyIsDown(83) && lightY<=height){
    lightY += lightMoveSpeed
    lastInteraction = millis()
    lightHeadingY++
  }
  lightHeading = createVector(lightHeadingX,lightHeadingY).normalize().mult(lightMoveSpeed)
  let fps = frameRate();
  textStyle(NORMAL)
  textSize(12)
  fill(255);
  stroke(0);
  textAlign(LEFT)
  if(dayCount>0)
    text("Separation-able enermy: " + separation_probability.toFixed(2)*100 + '%', 5, height - 40);
  text("Evasion-able enermy: " + evasion_probability.toFixed(2)*100 + '%', 5, height - 25);
  text("FPS: " + fps.toFixed(2), 5, height - 10);
  textAlign(CENTER)
  // Draw FPS (rounded to 2 decimal places) at the bottom left of the screen
  // retrieve from https://github.com/processing/p5.js/wiki/Optimizing-p5.js-Code-for-Performance
}

function drawDestinationSet() {
  fill(10, 80, 80, 30)
  destinationSet.forEach(function(t) {
    circle(t.x1, t.y1, 100)
    circle(t.x2, t.y2, 100)
  })
}

function drawBridges() {  
  push()
  translate(width*0.5,0.69*height)
  rotate(-PI/24)
  drawOneBridge();
  pop()
  push()
  translate(width*0.2,0.73*height)
  drawOneBridge();
  pop()
  push()
  translate(width*0.8,0.66*height)
  drawOneBridge();
  pop()
}

function drawOneBridge() {
  fill(20,60,60)
  rect(0,0,8*w,17*h)
  fill(20,60,40)
  
  push()
  for(let i=0;i<2;i++) {
    rotate(PI)
    beginShape()
    vertex(4*w, 9*h)
    vertex(5*w, 12*h)
    vertex(5.8*w, 11*h)
    vertex(5*w, 9*h)
    vertex(5*w, -9*h)
    vertex(5.8*w, -11*h)
    vertex(5*w, -12*h)
    vertex(4*w, -9*h)
    vertex(4*w, 9*h)
    endShape()
  }
  pop()
  push()
  translate(0, 15*h)
  drawSandbagBase()
  pop()
}

function drawSandbagBases() {
  push()
  translate(width*0.07,0.79*height)
  rotate(PI/24)
  drawSandbagBase()
  pop()
  push()
  translate(width*0.36,0.80*height)
  rotate(-PI/24)
  drawSandbagBase()
  pop()
  push()
  translate(width*0.66,0.74*height)
  rotate(-PI/36)
  drawSandbagBase()
  pop()
  push()
  translate(width*0.93,0.76*height)
  rotate(PI/24)
  drawSandbagBase()
  pop()
}

function drawSandbagBase() {  
  fill(30,30,60, 30)
  rect(0, 0, 13*w, 2.8*h)
  stroke(0)
  for(let i=0;i<7;i++) {
    push()
    translate(-5.4*w+i*1.8*w, 0)
    drawSandbag()
    pop()
  }
}

function drawSandbag() {  
  beginShape()    
  curveVertex(-0.9*w,-0.5*h)
  curveVertex(-0.9*w,0.5*h)
  curveVertex(-0.6*w,1.0*h)
  curveVertex(0.6*w,1.0*h)
  curveVertex(0.9*w,0.5*h)
  curveVertex(0.9*w,-0.5*h)
  curveVertex(0.6*w,-1.0*h)
  curveVertex(-0.6*w,-1.0*h)
  curveVertex(-0.9*w,-0.5*h)
  curveVertex(-0.9*w,0.5*h)
  curveVertex(-0.6*w,1.0*h)
  endShape()
}

function destination(x1, y1, x2, y2) {
  this.destinationA = createVector(x1,y1)
  this.destinationB = createVector(x2,y2)
}

function drawDefenders() {
  for(let i=defenders.length-1;i>-1;i--) {
    if(defenders[i].status==1) {
      vacancies.push(defenders[i].index)
      defenders.splice(i,1)
    } else {
      defenders[i].run()
    }
  }
  if(millis() - lastReplenishment>replenishInterval && vacancies.length>0) {
    replenish()
  }
  defenders.forEach(function(d) {
    push()
    translate(d.position.x, d.position.y)
    scale(2)
    fill(100, 0, 50, 50)
    circle(0, 0, 2*w)
    rotate(d.orientation)
    fill(60,70,70, 50)
    triangle(10,0, -5,5,-5,-5)
    pop()
  })
}

function replenish() {
  defenders.push(new Defender(vacancies.splice(0,1)))
  lastReplenishment = millis()
  replenishments.push(lastReplenishment)
}

function Defender(index) {
  this.index = index
  this.status = 0 // 0 for alive, 1 for dead
  this.ctgs = ctgs_defender  // Chance To Get Shot
  this.orientation = -PI/2
  this.defendingPosition = createVector(defendingPositions[index][0], defendingPositions[index][1])
  this.position = createVector(random(width), random(height, 1.1*height))
  this.lastShot = -10000
  this.gun_interval = 1500
  this.speed = defenderSpeed
}

Defender.prototype.getAttacked = function() {
  let c = random(0,1.0)
  if(c<this.ctgs) {
    this.status = 1
    deathEffects.push(new deathEffect(this.position.x, this.position.y, this.orientation, true, 0))
  }
}

Defender.prototype.run = function() {
  let range = 55 * h
  let nearest = 55 * h
  let target
  let distance
  let orientation = -PI/2
  let visibility = 0
  for(let j=flock.boids.length-1; j>-1; j--) {  
    distance = p5.Vector.dist(flock.boids[j].position, this.position)
    if(flock.boids[j].visibility>visibility && distance<range
      || (flock.boids[j].visibility==visibility && distance<nearest)) {
      target = flock.boids[j]
      nearest = distance
      orientation = p5.Vector.sub(target.position, this.position).heading()
      visibility = flock.boids[j].visibility
    }
  }
  this.target = target
  this.orientation = orientation
  this.distance = p5.Vector.dist(this.defendingPosition, this.position)
  if(this.distance<5 && this.target!=null) {
    if(DN == 1) {
      this.shoot()
    }    
  } else if(this.distance>=5) {
    this.move()
  }
}


Defender.prototype.shoot = function() {    
  if(millis()-this.lastShot>this.gun_interval){
    machinegun_sound.play()
    this.lastShot = millis()
    gunFires.push(new gunFire(this.position.x, this.position.y, this.orientation, this.position.dist(this.target.position), 0))
    gunFires.push(new gunFire(this.position.x, this.position.y, this.orientation, this.position.dist(this.target.position), -10))
    gunFires.push(new gunFire(this.position.x, this.position.y, this.orientation, this.position.dist(this.target.position), -20))
    this.target.getThreeShots()
    if(this.target.status==1) {
      this.target = null
    }
  }
}

Defender.prototype.move = function() {
  this.position.add(p5.Vector.sub(this.defendingPosition, this.position).normalize().mult(this.speed))
}

function Flock() {
  gene_pool = [new Gene(0.5, -10000, 10000, 0, 0, [0.5, 0.5, 0.5])]
  this.boids = [new Boid(), new Boid(), new Boid(), new Boid(), new Boid(), new Boid()]
}

Flock.prototype.run = function() {
  for(let i=this.boids.length-1;i>=0; i--) {
    if(this.boids[i].team==null && this.boids[i].position.y > height) {
      explosion_sound.play()
      explosions.push(new explosion(this.boids[i].position.x, this.boids[i].position.y))
      this.boids[i].status = 2     
      this.boids.splice(i,1)
    } else if(this.boids[i].team!=null && this.boids[i].team.vb.position.y > height + 4*w) {
      explosion_sound.play()
      explosions.push(new explosion(this.boids[i].position.x, this.boids[i].position.y))
      this.boids[i].status = 2     
      this.boids.splice(i,1)
    }else if(this.boids[i].status==2) {
      this.boids.splice(i,1)
    }
  }
  teams.forEach(function(t) {
    t.vb.calculateMove()
  })
  flock.boids.forEach(function (b) {
    b.run()
  })
  if(this.boids.length<enermyUpLimit && millis() - lastReinforce > reinforceInterval) {
    this.boids.push(new Boid())
    lastReinforce = millis()
  }
}

function next_set() {
  let g
  let td  // time difference
  let factor
  let features = [0, 0, 0]
  let factors = [0, 0, 0]
  for(let i=gene_pool.length-1; i>-1; i--) {
    g = gene_pool[i]
    td = millis()-g.t
    if(gene_pool.length>30 && td>30000) {
      gene_pool.splice(i,1)
    }
  }
  for(let i=0;i<features.length;i++) {
    for(let j=0;j<gene_pool.length;j++) {
      g = gene_pool[j]
      if(i == 0) {
        factor = g.d ** 2
      } else if (i == 1) {
        if(g.d < 0.2 || g.de != 1) {
          factor = 0
        } else {
          factor = 1 / (g.ga + 1) ** 3
        }   
      }      
      factors[i] += factor
      features[i] += g.f[i] * factor
    }
    if(factors[i] == 0) {
      features[i] = 0.5
    } else {
      features[i] /= factors[i]
    }    
  }
  evasion_probability = features[0]
  separation_probability = features[1]
  for(let i=0;i<features.length;i++) {
    features[i] = random() < 0.95 * features[i] ? 1 : 0 // Multiply 0.95 because of the burden of gene
    if(random() < mutation_rate) {
      features[i] = 1 - features[i]
    }
  }
  return features
}

function Gene(kill, time_stamp, duration, ga, dead, FeatureSet) {
  this.maxDuration = 40000
  this.d = Math.min(1, duration / this.maxDuration)
  this.k = kill
  this.t = time_stamp
  this.ga = ga
  this.de = dead
  this.f = FeatureSet
}

Gene.prototype.update = function(kill, time_stamp, duration, ga, dead, FeatureSet) {
  this.k = kill
  this.t = time_stamp
  this.d = Math.min(1, duration / this.maxDuration)
  this.ga = ga
  this.de = dead
  this.f = FeatureSet
}

function Boid() {
  this.id = boid_id++
  this.x = 0 + random(width)
  this.y = -100.0 + random(100)
  this.features = next_set()
  this.evade = this.features[0]
  this.separate = this.features[1]
  this.lineUp = 1  
  this.birth_time = millis()
  this.kill = 0
  this.team = null
  this.teamIndex = -1
  this.memberIndex = -1
  this.teamMadeTime = null
  this.standBy = false
  this.ga = 0   // Times of getting attacked
  let position = createVector(this.x, this.y)
  this.position = position
  let distance = 2000
  let destination = destinationSet[0].destinationA
  nextDestination = destinationSet[0].destinationB
  destinationSet.forEach(function(t) {
    if(t.destinationA.dist(position)<distance) {
      destination = t.destinationA.copy()
      nextDestination = t.destinationB.copy()
      distance = t.destinationA.dist(position)       
    }
  })
  this.status = 0  // 0 for moving, 1 for attacking, 2 for dead, 3 for gathering, 4 for marching, 5 for converging
  this.speed = enermySpeed
  this.target = null
  this.destination = destination
  this.nextDestination = nextDestination
  this.lastShot = -5000
  this.lastBeingShot = -5000
  this.gun_interval = 6000 // gun interval in ms
  this.orientation = PI/2
  this.ctgs = ctgs_invisible
  this.visibility = 0
  this.gene = new Gene(this.kill, this.birth_time, 0, 0, 0, this.features)
  gene_pool.push(this.gene)
}

Boid.prototype.run = function() {
  this.update()
  push()
  translate(this.position.x, this.position.y)
  scale(2)
  fill(0, 0, 0, 10)
  if(this.visibility==1){
    fill(0, 0, 0, 100)
  }
  circle(0, 0, 2*w)
  rotate(this.orientation)
  fill(0,70,70, 10)
  if(this.visibility==1){
    fill(0, 70, 70, 100)
  }
  triangle(10,0, -5,5,-5,-5)
  pop()
}

Boid.prototype.update = function() {
  let destination = this.destination.copy()
  let position = this.position.copy()
  if(DN == 0) {
    if(this.position.y>-0.1*height) {      
      this.position.add(createVector(0, -1).mult(this.speed))
    }
    this.orientation = -PI/2
    return
  }
  if(p5.Vector.dist(position, lightPosition)<=lightD/2){
    this.ctgs = ctgs_visible
    this.visibility = 1
  } else {
    this.ctgs = ctgs_invisible
    this.visibility = 0
  }
  let SH = createVector(0, 0)  // Separation heading
  this.neighbours = []
  for(let i=0;i<flock.boids.length;i++) {
    let b = flock.boids[i]
    if(b!=this && p5.Vector.dist(this.position, b.position)<4*w){
      this.neighbours.push(b)
      SH.add((p5.Vector.sub(this.position, b.position)).normalize())
    }
  }
  SH = SH.normalize()
  if(this.position.dist(destination)<30 && this.position.y<height) {
    this.destination = this.nextDestination.copy()
    this.nextDestination.add(0,height/2)
  }  
  let move = createVector(0, 0)
  let EH = this.evasionHeading()  // Evasion heading
  let EC = this.evade && EH  // Evasion condition
  let SC = (dayCount>=1) && (this.separate == 1) && (this.neighbours != null) && (this.neighbours.length != 0)  // Separation condition
  let LC = random() < this.lineUp
  let status = 0
  let target = null
  let nearest = 50 * h
  let orientation = this.orientation
  
  defenders.forEach(function(d) {
    if(d.position.dist(position) < nearest) {
      status = 1
      target = d
      nearest = d.position.dist(position)
    }
  })
  this.status = status
  this.target = target
  if(target != null) {
    orientation = p5.Vector.sub(target.position, position).heading()
  } else {      
    orientation = p5.Vector.sub(this.destination, position).heading()
  }
  this.orientation = orientation

  if(LC && dayCount%3==2) {
    let TC1 = this.team == null || this.team.size < 6  // Team condition 1
    let TC2 = this.teamMadeTime!= null && millis()-this.teamMadeTime<6000  // Team condition 2
    let TC3 = false  // Team condition 3
    if(this.team != null) {
      for(let i=0;i<this.team.members.length;i++) {
        if(this.team.members[i].rallyPoint!=null && p5.Vector.dist(this.team.members[i].rallyPoint, this.position)<1) {
          this.team.members[i].standBy = true
        } else if(this.team.members[i].rallyPoint==null) {
          continue
        }
        if(!this.team.members[i].standBy) {
          TC3 = true
          break
        }
      }
    }    
    if(TC1 && TC2 || TC3) {
      this.status = 3
    } else {
      this.status = 4
    }
    if(this.team == null) {
      if(teams.length != 0) {
        for(let i=0;i<teams.length;i++) {
          if(teams[i].size < 6) {
            teams[i].enlist(this)
            this.team = teams[i]
            this.memberIndex = this.team.size - 1
            this.teamIndex = teams.length - 1
            this.teamMadeTime = this.team.teamMadeTime
            break
          }
        }
      } 
      if(this.team == null) {
        teams.push(new Team(this))
        this.team = teams[teams.length-1]
        this.memberIndex = 0
        this.teamIndex = teams.length - 1
        this.teamMadeTime = this.team.teamMadeTime
      }
    }
    if(this.status == 3) {
      this.orientation = PI/2
      this.rallyPoint = createVector(18*w+18*w*(this.teamIndex % 5)+((this.memberIndex+1)%3-1)*4*w, -6*w*(floor(this.teamIndex/5)%2)+20*h-floor(this.memberIndex/3)*4*w)
      let distance = p5.Vector.dist(this.rallyPoint, this.position)
      move = p5.Vector.sub(this.rallyPoint, this.position).normalize().mult(this.speed)
      if(distance>2){
        this.position.add(move)
        if(this.memberIndex==0) {
          this.team.vb.position.add(move)
        }
      } else {
        this.standBy = true
      }
    } else if(this.status == 4) {
      this.team.vb.Move(this.memberIndex)
    }
  } else if(SC) {
    move = (p5.Vector.add(move, SH)).normalize().mult(this.speed)
    this.position.add(move)
  } else if(EC) {
    move = (p5.Vector.add(move, EH)).normalize().mult(this.speed)
    this.position.add(move)
  } else if(this.status==0) {
    move = p5.Vector.sub(this.destination, this.position).normalize().mult(this.speed)
    this.position.add(move)
  }
  if(this.shotsLeft>0 && millis()-this.lastBeingShot>150) {
    this.getAttacked()
    if(this.neighbours!=null) {      
      this.neighbours.forEach(function(n) {
        n.getAttacked()
        n.ga++
      })
    }
  }
  this.shoot()
  let dead = this.status == 2 ? 1 : 0
  this.gene.update(this.kill, this.birth_time, millis() - this.birth_time, this.ga, dead, this.features)
}

Boid.prototype.shoot = function() {

  if((this.status==1 || this.status==4) && this.target!=null && millis()-this.lastShot>this.gun_interval){
    this.lastShot = millis()
    gunFires.push(new gunFire(this.position.x, this.position.y, this.orientation, this.position.dist(this.target.position), 0))
    this.target.getAttacked()
    if(this.target.status==1) {
      this.target = null
      this.status = 0
    }
  }
}

Boid.prototype.getThreeShots = function() {
  this.shotsLeft = 3
  this.lastBeingShot = millis()
}

Boid.prototype.getAttacked = function() {
  let c = random(0,1.0)
  if(c<this.ctgs) {
    this.status = 2
    deathEffects.push(new deathEffect(this.position.x, this.position.y, this.orientation, false, this.visibility))
  }
  this.lastBeingShot = millis()
  this.shotsLeft--
}

Boid.prototype.evasionHeading = function() {
  let result
  let distance = p5.Vector.dist(lightPosition, this.position)
  if(distance < lightD / 1.6) {
    result = p5.Vector.sub(this.position, lightPosition).normalize()
    return result
  } else {
    result = createVector(0, 0)
    return false
  }
}

function Team(boid) {
  this.members = [boid]
  this.size = this.members.length
  this.index = teams.length
  this.vb = new virtualBoid(this.index, boid.position, boid.speed, boid.destination, boid.nextDestination, this)  // Virtual boid
  this.teamMadeTime = millis()
}

Team.prototype.enlist = function(boid) {
  this.members.push(boid)
  this.size = this.members.length
}

function virtualBoid(teamIndex, position, speed, destination, nextDestination, team) {
  this.teamIndex = teamIndex
  this.position = position.copy()
  this.speed = speed
  this.destination = destination.copy()
  this.nextDestination = nextDestination.copy()
  this.status = 3
  this.alive = true
  this.bridgeReached = false
  this.team = team
}

virtualBoid.prototype.calculateMove = function() {
  let membersAlive = false
  for(let i=0;i<teams[this.teamIndex].size;i++) {
    membersAlive = membersAlive || teams[this.teamIndex].members[i].status != 2
  }
  this.alive = membersAlive
  if(!this.alive) return
  this.move = createVector(0,0)
  this.status = 3
  let target
  let range = 50 * h
  let nearest = 5000
  let farthest = 0
  let position = this.position
  let distance = 0
  for(let i=0;i<defenders.length;i++) {
    d = defenders[i]
    if(d.position.dist(position) < nearest) {
      target = d
      nearest = d.position.dist(position)
    }
  }
  if(this.position.dist(this.destination)<50) {
    if(this.position.y > height + 2 * w) {
      this.alive = false
      return
    }
    this.destination = this.nextDestination.copy()
    this.nextDestination.add(0,height/2)
    this.bridgeReached = true
  }  
  nearest = range
  let m
  let standBy = true
  for(let i=0;i<teams[this.teamIndex].size;i++) {
    m = teams[this.teamIndex].members[i]
    standBy = standBy &&(m.status == 4)
  }
  if(standBy) {
    this.status = 4
    for(let i=0;i<teams[this.teamIndex].size;i++) {
      teams[this.teamIndex].members[i].status = 4
    }
    this.move = p5.Vector.sub(this.destination, position)
  }
  if(standBy && target != null && !this.bridgeReached) {
    for(let i=0;i<teams[this.teamIndex].members.length;i++) {
      m = teams[this.teamIndex].members[i]
      position = m.position
      m.target = target
      if(p5.Vector.dist(target.position, position) > farthest) {
        farthest = p5.Vector.dist(target.position, position)
        this.move = p5.Vector.sub(target.position, position)
      }
    }
  } else {
    this.move = p5.Vector.sub(this.destination, this.position)
  }

  distance = this.move.mag()
  this.move = p5.Vector.mult(this.move.normalize(), this.speed)
  if(this.status == 4 && distance>=2) {
    if(this.position.y<0.55*height){
      this.position.add(this.move)
    } else{
      this.move = p5.Vector.sub(this.destination, this.position).normalize().mult(this.speed)
      this.position.add(this.move)
    }      
  }
}

virtualBoid.prototype.Move = function(k) {
  let j = this.teamIndex
  teams[j].members[k].position.add(this.move)
}


function gunFire(x, y, orientation, distance, lifetime) {
  this.x = x
  this.y = y
  this.orientation = orientation
  this.lifetime = lifetime
  this.distance = distance
}

gunFire.prototype.run = function() {  
  this.lifetime += 1
  if(this.lifetime<0) return
  push()
  translate(this.x, this.y)
  rotate(this.orientation)
  translate(30+30*(this.lifetime), 0)
  fill(15, 80, 80)
  rect(0, 0, 60*(60-this.lifetime)/60, 3*(60-this.lifetime)/60)
  pop()
}

function explosion(x, y) {
  this.x = x
  this.y = y
  this.lifetime = 0
}

explosion.prototype.run = function() {
  this.lifetime++
  push()
  translate(this.x, this.y)
  scale(this.lifetime/60)
  fill(10, 100, 60, 100 * (1 - this.lifetime/60))
  circle(0, 0, 240)
  fill(20, 80, 80, 100 * (1 - this.lifetime/60))
  circle(0, 0, 180)
  fill(30, 60, 100, 100 * (1 - this.lifetime/60))
  circle(0, 0, 120)
  pop()
}

function deathEffect(x, y, o, d, v) {
  this.x = x
  this.y = y
  this.o = o
  this.d = d
  this.v = v
  this.lifetime = 0
}

function drawDeathEffects() {
  for(let i=deathEffects.length-1;i>-1;i--) {
    let e = deathEffects[i]
    if(e.lifetime>30) {
      deathEffects.splice(i, 1)
      continue
    }
    e.lifetime++
    if(e.d) {
      push()
      translate(e.x, e.y)
      scale(1+e.lifetime/10)
      fill(100, 0, 50, 50*(1-e.lifetime/30))
      circle(0, 0, 4*w)
      rotate(e.o)
      fill(60, 70, 70, 50*(1-e.lifetime/30))
      triangle(10,0, -5,5,-5,-5)
      pop()
    } else {
      push()
      translate(e.x, e.y)
      scale(1+e.lifetime/10)
      fill(0, 0, 0, 10*(1-e.lifetime/30))
      if(e.v==1){
        fill(0, 0, 0, 100*(1-e.lifetime/30))
      }
      circle(0, 0, 4*w)
      rotate(e.o)
      fill(0,70,70, 10*(1-e.lifetime/30))
      if(e.v==1){
        fill(0, 70, 70, 100*(1-e.lifetime/30))
      }
      triangle(10,0, -5,5,-5,-5)
      pop()
    }
  }
}

function drawHints() {
  textSize(24)
  textStyle(BOLD)
  let re = sin(2*PI*(millis()%1000)/1000)
  let lightness = 75+25*re
  push()
  translate(lightX, lightY)
  push()
  translate(0, -lightD/2)
  fill(30,50,80)
  triangle(0, -30, 15, 10, -15, 10)
  translate(0,9)
  fill(60,50,lightness)
  text("W", 0, -40)
  pop()
  
  push()
  translate(0, lightD/2)
  fill(30,50,80)
  triangle(0, 30, 15, -10, -15, -10)
  translate(0,9)
  fill(60,50,lightness)
  text("S", 0, 40)
  pop()
  
  push()
  translate(lightD/2, 0)
  fill(30,50,80)
  triangle(-10, 15, -10, -15, 30, 0)
  translate(0,9)
  fill(60,50,lightness)
  text("D", 40, 0)
  pop()
  
  push()
  translate(-lightD/2, 0)
  fill(30,50,80)
  triangle(10, -15, 10, 15, -30, 0)
  translate(0,9)
  fill(60,50,lightness)
  text("A", -40, 0)
  pop()

  pop()
}

function keyTyped() {
  if (key === " ") {
    saveCanvas("thumbnail.png");
  }
}