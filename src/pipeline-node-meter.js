/**
* @module Kiwi.Plugins
* @submodule MeterNode
* @namespace Kiwi.Plugins.DamagePipeline
*/

/**
* Meter Node, a pipeline object that extends the standard
*	Pipeline Node with a meter.
* <br><br>
* The Meter Node has several built-in functions.
*	Each receives a Pack as its argument.
*	You can override these to perform custom functionality.
*	<ul>
*	<li><code>doOnReceive</code>: called when the node receives a Pack.
*	Default behaviour: Apply Pack to meter</li>
*	<li><code>doOnZero</code>: called when the node drops to 0.
*	Default behaviour: None</li>
*	<li><code>doOnMax</code>: called when the node rises to maximum.
*	Default behaviour: None</li>
*	<li><code>doOnBreak</code>: called when the node drops below 0.
*	Default behaviour: None</li>
*	<li><code>doOnOverflow</code>: called when the node rises above maximum.
*	Default behaviour: None</li>
*	</ul>
* <br><br>
* The Pipeline Node inherits all functionality of the Pipeline Node,
*	but it implements a custom version of the <code>_operation</code> method.
*	You should override the above functions instead.
*	As an extension of PipelineNode, the MeterNode will automatically
*	process all packs and subpacks in bottom-up order. You do not need to
*	write methods to deal with subpacks.
*
* @class MeterNode
* @constructor
* @extends Kiwi.Plugins.DamagePipeline.PipelineNode
* @param params {Object} Parameter object
*	@param [params.children] {Array} Array of child nodes, or a single node
*	@param [params.name] {String} Unique identifier for this node
*	@param [params.defaultChildIndex] {Number} Default output
*	@param [params.doDefaultDispatch] {Boolean} Send packs to default output?
*	@param [params.doOnBreak] {Function} Called on meter < 0
*	@param [params.doOnMax] {Function} Called on meter = max
*	@param [params.doOnOverflow] {Function} Called on meter > max
*	@param [params.doOnReceive] {Function} Initial operation
*	@param [params.doOnZero] {Function} Called on meter = 0
*	@param [params.processOnReceive] {Boolean} Whether to process immediately
*	@param [params.tags] {Array} Array of tags, or a single tag
*	@param [params.value] {Number} Initial value of meter
*	@param [params.valueMax=100] {Number} Maximum value of meter
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.MeterNode = function( params ) {

	/**
	* Signal dispatched on meter break
	*	with parameter "this"
	* @property onBreak
	* @type Kiwi.Signal
	* @public
	* @since 0.1.0
	*/
	this.onBreak = new Kiwi.Signal();

	/**
	* Signal dispatched on meter max
	*	with parameter "this"
	* @property onMax
	* @type Kiwi.Signal
	* @public
	* @since 0.1.0
	*/
	this.onMax = new Kiwi.Signal();

	/**
	* Signal dispatched on meter overflow
	*	with parameter "this"
	* @property onOverflow
	* @type Kiwi.Signal
	* @public
	* @since 0.1.0
	*/
	this.onOverflow = new Kiwi.Signal();

	/**
	* Signal dispatched when the meter processes a pack
	*	with parameter "this"
	* @property onReceive
	* @type Kiwi.Signal
	* @public
	* @since 0.1.0
	*/
	this.onReceive = new Kiwi.Signal();

	/**
	* Signal dispatched on meter zero
	*	with parameter "this"
	* @property onZero
	* @type Kiwi.Signal
	* @public
	* @since 0.1.0
	*/
	this.onZero = new Kiwi.Signal();

	Kiwi.Plugins.DamagePipeline.PipelineNode.call( this, params );
};
Kiwi.extend(
	Kiwi.Plugins.DamagePipeline.MeterNode,
	Kiwi.Plugins.DamagePipeline.PipelineNode );


/**
* Normalized value is equal to value divided by valueMax.
* @property valueNormalized
* @type Number
* @public
* @since 0.1.0
*/
Object.defineProperty( Kiwi.Plugins.DamagePipeline.MeterNode.prototype,
		"valueNormalized", {
	get: function() {
		return this.value / this.valueMax;
	},
	set: function( value ) {
		Kiwi.Utils.GameMath.clamp( value, 1, 0 );
		this.value = value * this.valueMax;
	}
} );


/**
* Parses the params object and sanitizes input
* @method _parseParams
* @private
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.MeterNode.prototype._parseParams =
		function( params ) {

	/**
	* Maximum value of the meter
	* @property valueMax
	* @type Number
	* @default 100
	* @public
	* @since 0.1.0
	*/
	this.valueMax = typeof params.valueMax === "number" ?
		params.valueMax :
		100;

	/**
	* Value of the meter
	* @property value
	* @type Number
	* @default 100
	* @public
	* @since 0.1.0
	*/
	this.value = typeof params.value === "number" ?
		Math.min( params.value, this.valueMax ) :
		this.valueMax;

	/**
	* Value of the meter before the current Pack operation
	* @property valueLast
	* @type Number
	* @public
	* @since 0.1.0
	*/
	this.valueLast = this.value;

	// Remove params not used on this class
	params.operation = undefined;

	// Override default methods
	if ( typeof params.doOnBreak === "function" ) {
		this.doOnBreak = params.doOnBreak;
	}
	if ( typeof params.doOnMax === "function" ) {
		this.doOnMax = params.doOnMax;
	}
	if ( typeof params.doOnOverflow === "function" ) {
		this.doOnOverflow = params.doOnOverflow;
	}
	if ( typeof params.doOnReceive === "function" ) {
		this.doOnReceive = params.doOnReceive;
	}
	if ( typeof params.doOnZero === "function" ) {
		this.doOnZero = params.doOnZero;
	}

	// Super
	Kiwi.Plugins.DamagePipeline.PipelineNode.prototype._parseParams.call(
		this, params );
};


/**
* Empty method called on meter break, when the meter would go negative
*	(that is, the meter is empty, the Pack still
*	has value left, and the Pack is set to SUBTRACT mode).
*	Override this with your custom functionality.
* @method doOnBreak
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to process
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.MeterNode.prototype.doOnBreak = function( pack ) {

	// Your code here
};


/**
* Empty method called on meter max, when the meter rises to maximum.
*	Max does not occur if the meter was already at maximum.
*	Override this with your custom functionality.
* @method doOnMax
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to process
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.MeterNode.prototype.doOnMax = function( pack ) {

	// Your code here
};


/**
* Empty method called on meter overflow, when the meter would overflow
*	(that is, the meter is at max, the Pack still has value left, and
*	the Pack is set to ADD mode).
*	Override this with your custom functionality.
* @method doOnOverflow
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to process
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.MeterNode.prototype.doOnOverflow = function( pack ) {

	// Your code here
};


/**
* Default method executed upon receiving a Pack.
*	This will transfer value from the Pack to the meter's value,
*	according to the pack mode (ADD, SUBTRACT, or SET).
*	If there is any value left over, it will remain in the Pack.
*	It is not recommended that you override this function.
* <br><br>
* When receiving a Pack with mode SET, this function will assign as much value
*	to this meter as it can fit. Any leftover value will remain in the Pack.
*	This is intended to trigger overflow behaviour.
*	It might create unexpected results if the pack is not discarded.
* @method doOnReceive
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to process
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.MeterNode.prototype.doOnReceive = function( pack ) {
	var inverseValue;

	if ( pack.mode === pack.SUBTRACT ) {
		if ( pack.value <= this.value ) {
			this.value -= pack.value;
			pack.value = 0;
		} else {
			pack.value -= this.value;
			this.value = 0;
		}
	} else if (pack.mode === pack.ADD ) {
		inverseValue = this.valueMax - this.value;
		if ( pack.value <= inverseValue ) {
			this.value += pack.value;
			pack.value = 0;
		} else {
			pack.value -= inverseValue;
			this.value = this.valueMax;
		}
	} else if ( pack.mode === pack.SET ) {
		this.value = pack.value;
		if ( this.value > this.valueMax ) {
			pack.value = this.value - this.valueMax;
			this.value = this.valueMax;
		} else {
			pack.value = 0;
		}
	}
};


/**
* Empty method called on meter zero, when the meter drops to zero.
*	Zero does not occur if the meter was already at zero.
*	Override this with your custom functionality.
* @method doOnZero
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to process
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.MeterNode.prototype.doOnZero = function( pack ) {

	// Your code here
};


/**
* Core method that dispatches user-defined functions. Do not override.
* @method _operate
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to process
* @private
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.MeterNode.prototype._operate = function( pack ) {
	this.valueLast = this.value;

	// Default process
	this.doOnReceive( pack );
	this.onReceive.dispatch( this );

	// Has the meter hit max this operation?
	if ( this.value === this.valueMax && this.valueLast !== this.valueMax ) {
		this.doOnMax( pack );
		this.onMax.dispatch( this );
	}

	// Has the meter overflowed this operation?
	if ( this.value === this.valueMax && pack.value > 0 &&
			pack.mode === pack.ADD ) {
		this.doOnOverflow( pack );
		this.onOverflow.dispatch( this );
	}

	// Has the meter hit zero this operation?
	if ( this.value === 0 && this.valueLast !== 0 ) {
		this.doOnZero( pack );
		this.onZero.dispatch( this );
	}

	// Has the meter broken this operation?
	if ( this.value === 0 && pack.value > 0 && pack.mode === pack.SUBTRACT ) {
		this.doOnBreak( pack );
		this.onBreak.dispatch( this );
	}
};
