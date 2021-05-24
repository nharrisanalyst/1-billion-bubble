class Data{
	constructor({rawdata}){
		this._rawdata= rawdata;
		this._filtered_data = this._rawdata;
		this._data = this.roll_up(this._rawdata, d => d.brand, d => d.device_cummulative_cnts );
	}
	
	make_hierarchy_data(){
		d3.hierarchy({children: this.data}).sum(d => d.value);
	}
	
	get hierarchy_data(){
		return this.make_hierarchy_data();
	}
	
	filter(filter){
		this._data = this._rawdata.filter(filter);
		this._filtered_data =this._data;
	}
	//@data raw data current data
	//grouping is a function
	roll_up(data, grouping, sum){
		const new_data =[];
		d3.rollup(data, v => d3.sum(v, sum),grouping).forEach((value, key)=>{
			new_data.push({name:key, value:value});
		});
		return new_data;
	}
	
	 setData(grouping){
		this._data =  this.roll_up(this.data, d=>d[grouping], d=>d.device_cummulative_cnts)
	}
	
	get devicetypeLength(){
		const distinct ={}
		 const distinctArray =[]
		 this._filtered_data.forEach(d=>{
			 if(!distinct[d['idtype']]){
				 distinct[d['idtype']] =true;
				 distinctArray.push(d['idtype']);
			 }
		   }
		 )
		 
		return distinctArray.length; 
	}
	
	get distinctBrands(){
		const distinct ={}
		 const distinctArray =[]
		 this._filtered_data.forEach(d=>{
			 if(!distinct[d['brand']]){
				 distinct[d['brand']] =true;
				 distinctArray.push(d['brand']);
			 }
		   }
	    )
		   return distinctArray.length;
	}
	
	get length(){
		return this._rawdata.length;
	}
	
	total(){
		let total = 0;
		this._data.forEach(d=>{
			total += d.value;
		})
		return total;
	}
	 distinct(key){
		 const distinct ={}
		 const distinctArray =[];
		 this._rawdata.forEach(d=>{
			 if(!distinct[d[key]]){
				 distinct[d[key]] =true;
				 distinctArray.push(d[key]);
			 }
		   }
		 )
		 
		return ['All'].concat(distinctArray.sort()); 
	 }
	
	get data(){
		return this._data;
	}
	
}

const data = new Data({
	rawdata:data_raw.map(d=>{
		d.device_cummulative_cnts = parseInt(d.device_cummulative_cnts);
		return d;
	}),
})



const levels = ['brand', 'category']



















class Bubble{
	constructor({data, el}){
		this._data =data;
		this._el = el;
		this.margin ={l:20,t:20,r:20,b:20};
		this.width = this._el.getBoundingClientRect().width;
		this.height = this._el.getBoundingClientRect().height;
		this.pack = this._makePack() ;
		this._root =this.pack(this._data.data)
		this._level = 'brand';
	}
	
	_makeSVG(){
		this.svg = d3.select(this._el).append('svg')
		                                         .attr("viewBox", [0, 0, this.width, this.height])
												 .attr("font-size", 10)
												 .attr("text-anchor", "middle");
		
	}
	
	_makeGradient(){
		const lg =this.svg.append('defs')
		        .append('linearGradient')
				.attr('id', 'circleGradient')
				.attr('gradientTransform', 'rotate(90)')
				
	    lg.append('stop')
		         .attr('offset','0%')
				 .attr('stop-color','#DB6EA3')
		
		lg.append('stop')
		 .attr('offset','100%')
		 .attr('stop-color','#8884FF')
				
	}
	
	_makePack(){
        return (data) => d3.pack()
		.size([this.width - 2, this.height - 2])
		.padding(1)
	    (d3.hierarchy({children: this._data.data})
		.sum(d => d.value));
	}
	
	setLevel(index){
		this._level = levels[index];
	}
	
	_setOnClick(){
		const self = this;
		function onClick(event,d){
			if(self._level === 'brand'){
		     const brand = d.data.name;
		     self.setLevel(1);
			 self._data.filter(e => e.brand === brand);
			 self._data.setData(self._level);
			 self.rerender(self._data);
			}	
		}
		
		d3.selectAll('.circle-element').on('click', function(event, d) {
			onClick(event,d);
		  });
		
	}
	
	
	
	_makeBubbles(){
		const total = this._data.total();
		this.leaf = this.svg.selectAll("g")
		               .data(this._root.leaves())
		               .join("g")
		               .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`);
		
	   this.leaf.append("circle")
	      .attr('class', 'circle-element')
		  .attr("id", (d,i) => (d.leafUid =i))
		  .attr("r", d => d.r)
		  .attr("fill-opacity", 1)
		  .attr("fill", "url('#circleGradient')");
		  
		  this.leaf.append("text")
		    .attr('class', 'circle-text')
			.style('pointer-events', 'none')
		    .attr('fill','rgb(250,250,250)')
			.attr('font-size', '12px')
			.attr("clip-path", d => d.clipUid)
		    .selectAll("tspan")
		    .data(d => [{text:d.data.name, r:d.r}, {text:d3.format('.2%')(d.data.value/total), r:d.r}])
		    .join("tspan")
			.attr("x", 0)
			.attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
			.text(d =>d.r>20? d.text: "");
	}
	
	_setOnHover(){
		function mouseover(){
			d3.selectAll('.circle-element')
			          .attr("fill-opacity", 0.2)
					  
		    d3.selectAll('.circle-text')
			  .attr("opacity", 0.2);
			  
		    d3.select(this)
			   .attr("fill-opacity", 1)
			d3.select(this.parentNode).selectAll('.circle-text')
			                .attr("opacity", 1)
		 }
		function mouseout(){
			d3.selectAll('.circle-element')
			  .attr("fill-opacity", 1)
			d3.selectAll('.circle-text')
			  .attr("opacity", 1);
		}
		d3.selectAll('.circle-element').on('mouseover', mouseover);
		d3.selectAll('.circle-element').on('mouseout',mouseout);
	}
	
	render(){
	 if(this.svg){
	  this.svg.remove();
      }
	  this._makeSVG();
	  this._makeGradient();
	  this._makePack()
	  this._makeBubbles();
	  this._setOnClick();
	  this._setOnHover();
	}
	
	rerender(data){
		this._data =data;
		this.pack = this._makePack(); 
		this._root =this.pack(this._data.data);
		this.render()
	}
}


















class Selector{
	constructor({back,data, el, menu, title, chart}){
		this._data = data;
		this._el = el;
		this._title = title;
		this._chart = chart;
		this._menu = menu
		this._divElData =[{class:'filterLabel'}, {class:'filterSelect'}]
		this._back = back;
	}
	
	makeMainDiv(){
		this.mainDiv = d3.select(this._el).append('div')
		                            .attr('class', 'filterLabel-wrapper');
	}
	
	makeInnerDiv(){
		this._mainSelection = this.mainDiv.selectAll('div').data(this._divElData)
		                                                   .join('div')
					                                        .attr('class', d=> d.class);
	}
	
	_makeSelection(){
		this._filter_selection = d3.select('.filterSelect').append('select')
		                                            .attr('class', 'filterSelect-select')
		                                            .selectAll('options')
													.data(this._data.distinct('category'))
													.join('option')
													.attr('value', d =>d)
													.text(d=>d);
		                                            
	}
	
	_makeTitle(){
		this._title_selection = d3.select('.filterLabel')
		this._title_selection.append('div')
		                      .attr('class','filterLabel-title')
							  .text(this._title)
	}
	
	_onChange(){
		const self = this;
	    const selection = d3.select('.filterSelect-select')
	                        .on('change', function(event,d){
								const value = event.target.value;
								if(event.target.value ==='All'){
									self._data.filter(d=> true);
									self._data.setData('brand');
									self._chart.rerender(data);
									self._menu.rerender();
									self._back.unrender();
									return;
								}
								self._data.filter(d=> d[self._title] === value );
								self._data.setData('brand');
								self._chart.rerender(data);
								self._menu.rerender();
								self._back.render();
							})
		
	}
	
	allRender(){
		this._data.filter(d=> true);
		this._data.setData('brand');
		this._chart.rerender(data);
		this._menu.rerender();
		this._back.unrender();
		this.rerender();
	}
	
	render(){
		this.makeMainDiv();
		this.makeInnerDiv();
		//this._makeTitle();
		this._makeSelection();
		this._onChange();
	}
	
	rerender(){
		this.mainDiv.remove();
		this.render();
	}
	
}















class Menu{
	constructor({data, el}){
		this._data = data;
		this._el = el;
		this._menuData = this._makeMenuData();
	}
		 _makeMenuData(){
			return [{title:'Brands', value:this._data.distinctBrands},
			        {title:'Device Types', value:this._data.devicetypeLength}]
		}
    _makeHeadlineStat(){
		this._mainDiv = d3.select(this._el).append('div')
		                                   .attr('class', 'chart-menu-inner-wrapper')
		                    
			  this._mainDiv.selectAll('div')
		                    .data(this._makeMenuData())
							.join('div')
							.attr('class', d => `menu-stat-wrapper ${d.title}-menu-stat`)
							.html(d=> this._makeStatHTML(d));
							
	}
	
	_makeStatHTML(d){
		return `<div class='stat-title'>${d.title}</div>
		        <div class='stat-value'>${d.value}</div>
		       `
	}
		
	render(){
		this._makeHeadlineStat();
	}
	
	rerender(){
		if(this._mainDiv){
			  this._mainDiv.remove();
			  }
		this._menuData = this._makeMenuData();
		this.render();	
	}
}


class Back{
	constructor({el, menu}){
		this._el = el;
		this._seelector = null;
	}
	_onClick(){
		const self = this;
		d3.select('.d3-bubble-chart-selector-title').on('click',function(){
			self.unrender()
			self._selector.allRender();
		})
	}
	
	_offClick(){
		
	}
	
	set selector(selector){
		this._selector = selector;
	}
	
	
	render(){
		d3.select(this._el).attr('class', 'd3-bubble-chart-selector-title title-active')
		              .text('Back to all devices');
		this._onClick();
	}
	unrender(){
		d3.select(this._el).attr('class', 'd3-bubble-chart-selector-title')
		  .text('Take a closer look');
        this._offClick();
	}
}
 

const bubble = new Bubble({
	data:data,
	el:document.querySelector('.d3-bubble-chart-right')
})



bubble.render();

const menu = new Menu({
	data:data,
	el:document.querySelector('.d3-bubble-chart-menu-menu'),
})

const back = new Back({
	el:document.querySelector('.d3-bubble-chart-selector-title'),
	menu:menu
})

const selector = new Selector({
	data:data,
	el:document.querySelector('.d3-bubble-chart-selector-selector'),
	title:"category",
	chart:bubble,
	menu:menu,
	back:back
})

back.selector = selector;

selector.render();
menu.render();

