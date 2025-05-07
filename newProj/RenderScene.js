renderer = {
	init: function()
	{
		this.trail = [];
		this.a=1;
		this.r=39;
		this.mass = [];
		const initialMass = parseFloat(document.getElementById('massInput').value) || 1.0;
		this.vd=0.95 ;

		this.g=3;

		this.deviceTilt={x:0,y:0.1};

		this.air_res=0;

		this.adding_mode=0;

		this.touch_mode=0;

		this.touched_ball=[];
		this.touch_x=[];
		this.touch_y=[];
		this.touch_x_1=[];
		this.touch_y_1=[];

		this.x=[];
		this.y=[];
		this.Vx=[];
		this.Vy=[];
		this.ball_mode=[];

		function createMassGradient() {
			const canvas = document.getElementById('massGradient');
			const ctx = canvas.getContext('2d');
			const gradient = ctx.createLinearGradient(0, 0, 200, 0);

			for(let i = 0; i <= 1; i += 0.1) {
				const hue = 240 - (240 * i);
				ctx.fillStyle = `hsl(${hue}, 80%, ${50 - (i * 15)}%)`;
				ctx.fillRect(i * 200, 0, 20, 30);
			}
		}
		createMassGradient();

		for(var i=0;i<10;i++)
			this.touched_ball[i]=-1;

		this.num=5;

		for (var i=0; i<this.num; i++) {
			this.x[i]=Math.random()*canvas.width;
			this.y[i]=Math.random()*canvas.height;
			this.Vx[i]=-10+10*Math.random();
			this.Vy[i]=-10+10*Math.random();
			this.ball_mode[i]=0;
			this.mass[i] = initialMass;
		}
		this.DeltaT=0.1;

	},

	accelerometer: function(acceleration)
	{
		this.deviceTilt.x = -0.1*acceleration.x;
		this.deviceTilt.y = 0.1*acceleration.y;
	},
	
	
	render: function()
	{
		ctx.clearRect(0,0,canvas.width,canvas.height);
		this.Picture();
	},

	Picture: function()
	{
		for (var i=0; i<10; i++) {
			if (this.touched_ball[i]>=0) {
				this.touch_x_1[i]=this.touch_x[i];
				this.touch_y_1[i]=this.touch_y[i];
				if (this.ball_mode[this.touched_ball[i]]!=1) {
					const massFactor = 1 / this.mass[this.touched_ball[i]];
					this.Vx[this.touched_ball[i]] = -0.5*(this.x[this.touched_ball[i]]-this.touch_x_1[i])/this.DeltaT/10.0 * massFactor;
					this.Vy[this.touched_ball[i]] = -0.5*(this.y[this.touched_ball[i]]-this.touch_y_1[i])/this.DeltaT/10.0 * massFactor;
				}
				else
				{
					this.x[this.touched_ball[i]]=this.touch_x[i];
					this.y[this.touched_ball[i]]=this.touch_y[i];
				}
				
			}
		}
		for (var t=0; t<10; t++) {
			for(var i=0; i<this.num; i++) {
				if(this.ball_mode[i] !== 1) {
					this.Vx[i] += this.deviceTilt.x * this.g * this.DeltaT;
					this.Vy[i] += this.deviceTilt.y * this.g * this.DeltaT;
				}
			}

			for (var i=0; i<this.num; i++) {
				if (this.ball_mode[i]!=1)
				{
					this.x[i]+=this.Vx[i]*this.DeltaT;
					this.y[i]+=this.Vy[i]*this.DeltaT;
				}
				else
				{
					this.Vx[i]=0;
					this.Vy[i]=0;
				}
				var deltaX,deltaY;
				if (this.ball_mode[i]==3 && i!=0) {
					deltaX=this.x[i]-this.x[i-1];
					deltaY=this.y[i]-this.y[i-1];
					this.Vx[i]-=0.3/this.r*(deltaX-2*this.r*deltaX/Math.sqrt(deltaX*deltaX+deltaY*deltaY));
					this.Vy[i]-=0.3/this.r*(deltaY-2*this.r*deltaY/Math.sqrt(deltaX*deltaX+deltaY*deltaY));
				}
				if (this.ball_mode[i]!=1 && i!=this.num-1 && this.ball_mode[i+1]==3) {
					deltaX=this.x[i]-this.x[i+1];
					deltaY=this.y[i]-this.y[i+1];
					this.Vx[i]-=0.3/this.r*(deltaX-2*this.r*deltaX/Math.sqrt(deltaX*deltaX+deltaY*deltaY));
					this.Vy[i]-=0.3/this.r*(deltaY-2*this.r*deltaY/Math.sqrt(deltaX*deltaX+deltaY*deltaY));
				}

				this.Vx[i] -= (this.Vx[i] * this.air_res) / this.mass[i];
				this.Vy[i] -= (this.Vy[i] * this.air_res) / this.mass[i];
				
				
				if (this.x[i]>canvas.width-this.r) {
					this.Vx[i]=-this.Vx[i]*this.vd;
					this.x[i]=canvas.width-this.r;
				}
				else if(this.x[i]<this.r)
				{
					this.Vx[i]=-this.Vx[i]*this.vd;
					this.x[i]=this.r;
				}
				if (this.y[i]>canvas.height-this.r) {
					this.Vy[i]=-this.Vy[i]*this.vd;
					this.y[i]=canvas.height-this.r;
				}
				else if(this.y[i]<this.r)
				{
					this.Vy[i]=-this.Vy[i]*this.vd;
					this.y[i]=this.r;
				}
			}
			this.CheckDistance();

		}
		for(var i=0;i<this.num;i++) {
			const currentMass = this.mass[i];

			switch (this.ball_mode[i]) {
				case 0:
					this.drawBall(this.x[i], this.y[i], currentMass);
					break;
				case 1:
					// Fixed ball style (red)
					ctx.fillStyle = "#ff0000";
					ctx.beginPath();
					ctx.arc(this.x[i], this.y[i], this.r, 0, Math.PI*2);
					ctx.fill();
					break;
				case 2:
					this.drawBall(this.x[i], this.y[i], currentMass);
					if (i!=0) {
						ctx.strokeStyle="black";
						this.drawLine(this.x[i-1],this.y[i-1],this.x[i],this.y[i]);
					}
					break;
				case 3:
					this.drawBall(this.x[i], this.y[i], currentMass);
					if (i!=0) {
						ctx.strokeStyle="gray";
						this.drawLine(this.x[i-1],this.y[i-1],this.x[i],this.y[i]);
					}
					break;
			}
		}
	},

	CalVelocity: function(i, j) {
		var dx = this.x[i] - this.x[j];
		var dy = this.y[i] - this.y[j];
		var dr = dx * dx + dy * dy;
		if (dr !== 0) {
			var dr_ = Math.sqrt(dr);
			var unitNormalX = dx / dr_;
			var unitNormalY = dy / dr_;
			var unitTangentX = -dy / dr_;
			var unitTangentY = dx / dr_;

			var v1n = this.Vx[i] * unitNormalX + this.Vy[i] * unitNormalY;
			var v1t = this.Vx[i] * unitTangentX + this.Vy[i] * unitTangentY;
			var v2n = this.Vx[j] * unitNormalX + this.Vy[j] * unitNormalY;
			var v2t = this.Vx[j] * unitTangentX + this.Vy[j] * unitTangentY;

			var m1 = this.mass[i];
			var m2 = this.mass[j];

			var newV1n = ((m1 - m2) * v1n + 2 * m2 * v2n) / (m1 + m2);
			var newV2n = (2 * m1 * v1n + (m2 - m1) * v2n) / (m1 + m2);

			this.Vx[i] = newV1n * unitNormalX + v1t * unitTangentX;
			this.Vy[i] = newV1n * unitNormalY + v1t * unitTangentY;
			this.Vx[j] = newV2n * unitNormalX + v2t * unitTangentX;
			this.Vy[j] = newV2n * unitNormalY + v2t * unitTangentY;

			var overlap = 2 * this.r - dr_;
			if (overlap > 0) {
				var totalMass = m1 + m2;
				var correctionRatioi = m2 / totalMass;
				var correctionRatioj = m1 / totalMass;

				if (this.ball_mode[i] != 1) {
					this.x[i] += overlap * correctionRatioi * (dx / dr_);
					this.y[i] += overlap * correctionRatioi * (dy / dr_);
				}
				if (this.ball_mode[j] != 1) {
					this.x[j] -= overlap * correctionRatioj * (dx / dr_);
					this.y[j] -= overlap * correctionRatioj * (dy / dr_);
				}
			}
		}
	},

	CheckDistance: function()
	{
		for(var i=0;i<this.num-1;i++)
			for(var j=i+1;j<this.num;j++)
				if((Math.sqrt((this.x[i]-this.x[j])*(this.x[i]-this.x[j])+(this.y[i]-this.y[j])*(this.y[i]-this.y[j]))<this.r*2 || (this.ball_mode[j]==2 && j==i+1)))
					this.CalVelocity(i,j);
	},
	check: function(i)
	{
		var IsTooClose=false;
		for(var j=0;j<i;j++)
			if(Math.sqrt((this.x[i]-this.x[j])*(this.x[i]-this.x[j])+(this.y[i]-this.y[j])*(this.y[i]-this.y[j]))<this.r*2)
				IsTooClose=true;
		return IsTooClose;
	},

	drawBall: function(x, y, mass) {
		// Mass-to-color mapping parameters
		const minMass = 0.1;
		const maxMass = 100.0;
		const massRatio = Math.min(Math.max(
			(mass - minMass) / (maxMass - minMass),
			0), 1
		);

		const hue = 240 - (240 * massRatio);
		const saturation = 80;
		const lightness = 50 - (massRatio * 15);

		const gradient = ctx.createRadialGradient(
			x - this.r/2, y - this.r/2, this.r/4,
			x, y, this.r
		);
		gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness+20}%, 1)`);
		gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`);

		ctx.beginPath();
		ctx.arc(x, y, this.r, 0, Math.PI * 2);
		ctx.fillStyle = gradient;
		ctx.fill();

		ctx.beginPath();
		ctx.arc(x + this.r/3, y - this.r/3, this.r/4, 0, Math.PI * 2);
		ctx.fillStyle = `hsla(0, 0%, 100%, 0.4)`;
		ctx.fill();
	},

	drawBall1: function(x,y)
	{
		ctx.drawImage(ballImage1,x-this.r,y-this.r,this.r*2,this.r*2);
	},
	
	drawLine: function(x1,y1,x2,y2)
	{
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.stroke();
	},
	Slider1Changed: function(value)
	{
		this.r=value;
	},
	Slider2Changed: function(value)
	{
		this.vd=value;
	},
	Slider3Changed: function(value)
	{
		this.g=value;
	},
	Slider4Changed: function(value)
	{
		this.air_res=value;
	},
	btnRestartClicked: function()
	{
		this.num=0;
	},
	btnAddClicked: function()
	{
		const newMass = parseFloat(document.getElementById('massInput').value) || 1.0;

		this.x[this.num]=Math.random()*canvas.width;
		this.y[this.num]=Math.random()*canvas.height;
		this.Vx[this.num]=-5+10*Math.random();
		this.Vy[this.num]=-5+10*Math.random();
		this.ball_mode[this.num]=this.adding_mode;
		this.mass[this.num] = newMass;
		this.num++;
	},
	btnRemoveClicked: function()
	{
		this.num--;
		if(this.num<0)this.num=0;
	},
	segmentedChanged: function(value)
	{
		this.adding_mode=value;
	},

	touchModeChanged: function(value)
	{
		this.touch_mode=value;
	},

	touchesBegan: function(n,x_,y_)
	{
		const newMass = parseFloat(document.getElementById('massInput').value) || 1.0;

		this.touch_x[n]=this.touch_x_1[n]=x_;
		this.touch_y[n]=this.touch_y_1[n]=y_;
		
		if (this.touch_mode!=1) {
			for (var i=0; i<this.num; i++)
				if(Math.sqrt((this.x[i]-this.touch_x[n])*(this.x[i]-this.touch_x[n])+(this.y[i]-this.touch_y[n])*(this.y[i]-this.touch_y[n]))<Math.max(this.r, 40))
					this.touched_ball[n]=i;
		}
		
			if (this.touched_ball[n]==-1 && this.touch_mode==1) {
			for (var i=0; i<this.num; i++)
				if(Math.sqrt((this.x[i]-this.touch_x[n])*(this.x[i]-this.touch_x[n])+(this.y[i]-this.touch_y[n])*(this.y[i]-this.touch_y[n]))<this.r)
					return;
			this.x[this.num]=this.touch_x[n];
			this.y[this.num]=this.touch_y[n];
			this.Vx[this.num]=0;
			this.Vy[this.num]=0;
			this.ball_mode[this.num]=this.adding_mode;
			this.mass[this.num] = newMass;
			this.num++;
		}
	},
	touchesMoved: function(n,x_,y_)
	{
		const newMass = parseFloat(document.getElementById('massInput').value) || 1.0;

		this.touch_x[n]=x_;
		this.touch_y[n]=y_;
		
		if (this.touched_ball[n]==-1 && this.touch_mode==1) {
			for (var i=0; i<this.num; i++)
				if(Math.sqrt((this.x[i]-this.touch_x[n])*(this.x[i]-this.touch_x[n])+(this.y[i]-this.touch_y[n])*(this.y[i]-this.touch_y[n]))<this.r)
					return;
			this.x[this.num]=this.touch_x[n];
			this.y[this.num]=this.touch_y[n];
			this.Vx[this.num]=0;
			this.Vy[this.num]=0;
			this.ball_mode[this.num]=this.adding_mode;
			this.mass[this.num] = newMass;
			this.num++;
		}
		 
		
	},
	touchesEnded: function(n,x_,y_)
	{
		this.touch_x[n]=x_;
		this.touch_y[n]=y_;
		this.touched_ball[n]=-1;
	}


}
