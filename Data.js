d3.select('.d3-bubble-chart').html("hello world");
console.log("======>",data_raw);
class Data{
	constructor({rawdata}){
		this._rawdata= rawdata;
		this._data = this.roll_up(this._rawdata, d => d.brand, d => d.device_cummulative_cnts );
		
		console.log(this.data);
	}
	
    make_hierarchy_data(){
		d3.hierarchy({children: this.data}).sum(d => d.value);
	}
	
	get hierarchy_data(){
		return this.make_hierarchy_data();
	}
	
	filter(filter){
		this.data = this._rawdata.filter(filter);
	}
	//@data raw data current data
	//grouping is a function
	roll_up(data, grouping, sum){
		console.log('======>', d3.rollup);
		console.log('======>', grouping);
		console.log('====>', data);
		return d3.rollup(data, v => d3.sum(v, sum),grouping);
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

console.log('=========>', data.data);