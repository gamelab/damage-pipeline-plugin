/**
* Damage Pipeline encompasses methods to perform advanced damage processing.
*
* @module Kiwi
* @submodule Plugins
* @namespace Kiwi.Plugins
* @class DamagePipeline
*/
Kiwi.Plugins.DamagePipeline = {

	/**
	* The name of this plugin.
	* @property name
	* @type String
	* @public
	*/
	name:"DamagePipeline",

	/**
	* The version of this plugin.
	* @property version
	* @type String
	* @public
	*/
	version:"1.0.0",

	/**
	* Minimum version of Kiwi.js library
	* @property minimumKiwiVersion
	* @type String
	* @public
	*/
	minimumKiwiVersion: "1.1.0",

};

/**
* Registers this plugin with the Global Kiwi Plugins Manager if it is available.
*/
Kiwi.PluginManager.register( Kiwi.Plugins.DamagePipeline );

/**
* This create method is executed when Kiwi Game that has been told
* to use this plugin reaches the boot stage of the game loop.
* @method create
* @param game{Kiwi.Game} The game that is current in the boot stage.
* @private 
*/
Kiwi.Plugins.DamagePipeline.create = function( game ) {};

/**
* @module Kiwi.Plugins
* @submodule Pack
* @namespace Kiwi.Plugins.DamagePipeline
*/

/**
* Damage Pack, a message containing information about incoming damage.
* @class Pack
* @constructor
* @param params {object} Parameter object
* @param params.value {number} Value of the damage pack
* @param [params.mode] {string} Operational mode: one of
*	Kiwi.Plugins.DamagePipeline.Pack.prototype.SUBTRACT (default),
*	Kiwi.Plugins.DamagePipeline.Pack.prototype.ADD, or
*	Kiwi.Plugins.DamagePipeline.Pack.prototype.SET.
*	You may also use string shortcuts "ADD", "SET", and "SUBTRACT".
* @param [params.owner] {object} Whosoever dealt it.
* @param [params.subPacks=[]] {array} List of subordinate Packs.
* @param [params.tags=[]] {array} List of tags for this pack,
*	as strings or numbers.
* @return {Kiwi.Plugins.DamagePipeline.Pack}
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack = function( params ) {

	/**
	* An exhausted Pack will have no further effect.
	*	The tree may terminate its traversal.
	* @property exhausted
	* @default false
	* @type number
	* @public
	* @since 0.1.0
	*/
	this.exhausted = false;

	/**
	* Private value of this Pack.
	* @property _value
	* @type Number
	* @private
	* @since 0.1.0
	*/
	this._value = 0;

	/**
	* Sub-packs for this Pack, representing subordinate damage sources.
	* @property subPacks
	* @type Array
	* @default []
	* @public
	* @since 0.1.0
	*/
	this.subPacks = [];

	this.parseParams( params );

	return this;
};

/**
* Damage mode: add to meters.
* @property ADD
* @type number
* @default 0
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.ADD = 0;

/**
* Damage mode: set meters to constant value.
* @property SET
* @type number
* @default 1
* @public
* @final
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.SET = 1;

/**
* Damage mode: subtract from meters.
* @property SUBTRACT
* @type number
* @default 2
* @public
* @final
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.SUBTRACT = 2;

/**
* Value of this Pack. If it falls to or below 0, it is exhausted.
* <BR><BR>
* When you modify value, it will automatically check and
*	discard any exhausted subPacks. This is designed for a pipeline
*	in which subPacks are evaluated before the parent pack.
* @property value
* @type Number
* @public
* @final
* @since 0.1.0
*/
Object.defineProperty( Kiwi.Plugins.DamagePipeline.Pack.prototype,
		"value", {
	get: function() {
		return this._value;
	},
	set: function( value ) {
		this._value = value;
		this.checkExhaustion();
	}
} );

/**
* Checks for exhaustion on this and all subPacks
* @method checkExhaustion
* @return {Boolean} The current exhaustion state of this pack
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.checkExhaustion = function() {
	if ( this._value <= 0 ) {
		this._value = 0;
		this.exhausted = true;
	}
	this.discardExhaustedSubPacks();

	return this.exhausted;
};

/**
* Clones this Pack, along with all subpacks
* @method clone
* @return Kiwi.Plugins.DamagePipeline.Pack
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.clone = function() {
	var i,
		params = {
			value: this.value,
			mode: this.mode,
			owner: this.owner,
			subPacks: [],
			tags: []
		};

	for ( i = 0; i < this.subPacks.length; i++ ) {
		params.subPacks.push( this.subPacks[ i ].clone() );
	}
	for ( i = 0; i < this.tags.length; i++ ) {
		params.tags.push( this.tags[ i ] );
	}

	return new Kiwi.Plugins.DamagePipeline.Pack( params );
};

/**
* Removes all subPacks that are now exhausted. You do not normally need to call
*	this method; it will automatically occur while modifying values.
* @method discardExhaustedSubPacks
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.discardExhaustedSubPacks =
		function() {
	var i;

	for ( i = this.subPacks.length - 1; i >= 0 ; i-- ) {
		this.subPacks[ i ].discardExhaustedSubPacks();
		if ( this.subPacks[ i ].exhausted ) {
			this.subPacks.splice( i, 1 );
		}
	}
};

/**
* Extracts and returns a subPack from this Pack or subpacks.
*	Some damage pipeline nodes may split packs onto different branches.
*	If the subPack is not found, this returns null.
* @method extractSubPack
* @param pack {Pack} Pack to extract
* @return Pack
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.extractSubPack =
		function( pack ) {
	var i,
		packIndex = this.subPacks.indexOf( pack );

	if ( packIndex !== -1 ) {
		this.subPacks.splice( packIndex, 1 );
		return pack;
	}
	for ( i = 0; i < this.subPacks.length; i++ ) {
		if ( this.subPacks[ i ].extractSubPack( pack ) ) {
			return pack;
		}
	}
	return null;
};

/**
* Returns a list of all subPacks and this Pack.
*	These will be in reverse order to a normal traversal, so this pack
*	will be last in the list. This facilitates pipeline processing.
* @method getAllPacks
* @public
* @return Array
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.getAllPacks = function() {
	var i,
		array = [];

	for ( i = 0; i < this.subPacks.length; i++ ) {
		array = array.concat( this.subPacks[ i ].getAllPacks() );
	}
	array.push( this );

	return array;
};

/**
* Returns whether this pack has the specified tag.
* @method hasTag
* @param tag {String} Tag to check; may also be of type Number
* @return Boolean
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.hasTag = function( tag ) {
	return this.tags.indexOf( tag ) !== -1;
};

/**
* Returns whether this pack has any tag from the specified array.
*	An empty array is always true.
* @method hasTagInArray
* @param array {Array} Array of tags, either String or Number
* @return Boolean
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.hasTagInArray = function( array ) {
	var i, tag;
	if ( Kiwi.Utils.Common.isArray( array ) ) {
		if ( array.length === 0 ) {
			return true;
		}
		for ( i = 0; i < array.length; i++ ) {
			tag = array[ i ];
			if ( this.hasTag( tag ) ) {
				return true;
			}
		}
	}
	return false;
};

/**
* Returns the type of object that this is.
* @method objType
* @return {string}
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.objType = function() {
	return "Pack";
};

/**
* Parses the param object and sanitizes inputs.
* @method parseParams
* @param params {object} The param object from the constructor.
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.Pack.prototype.parseParams =
		function( params ) {
	var i, tag;

	// The user might just pass a damage value.
	if ( typeof params === "number" ) {
		params = { value: params };
	}

	this.value = params.value;
	this.subPacks = params.subPacks || [];

	/**
	* Mode of this Pack, either ADD, SUBTRACT or SET.
	* @property mode
	* @type Number
	* @default this.SUBTRACT
	* @public
	* @since 0.1.0
	*/
	this.mode = params.mode;

	/**
	* Owner of this Pack. If the owner was not set, it returns null.
	* @property owner
	* @type Object
	* @default null
	* @public
	* @since 0.1.0
	*/
	this.owner = params.owner || null;

	/**
	* Tags for this Pack, representing special information
	*	about damage types such as "fire" or "stun".
	* @property tags
	* @type Array
	* @default []
	* @public
	* @since 0.1.0
	*/
	this.tags = [];

	// Sanitize value
	if ( isNaN( this.value ) ) {
		this.value = 0;
	}
	if ( this.value === 0 ) {
		this.exhausted = true;
	}

	// Sanitize mode
	if ( typeof this.mode === "string" ) {
		if ( this.mode.toUpperCase() === "ADD" ) {
			this.mode = this.ADD;
		} else if ( this.mode.toUpperCase() === "SET" ) {
			this.mode = this.SET;
		} else if ( this.mode.toUpperCase() === "SUBTRACT" ) {
			this.mode = this.SUBTRACT;
		}
	}
	if ( isNaN( this.mode ) ||
			!( this.mode === this.ADD ||
				this.mode === this.SET ||
				this.mode === this.SUBTRACT
				)
			) {
		this.mode = this.SUBTRACT;
	}

	// Sanitize subPacks
	if ( Kiwi.Utils.Common.isArray( this.subPacks ) ) {
		for ( i = this.subPacks.length - 1; i >= 0; i-- ) {
			if ( this.subPacks[ i ].objType ) {
				if ( this.subPacks[ i ].objType() !== "Pack" ) {
					this.subPacks.splice( i, 1 );
				}
			} else {
				this.subPacks.splice( i, 1 );
				console.error( "Invalid component in params.subPacks" );
			}
		}
	} else if ( this.subPacks && this.subPacks.objType &&
			this.subPacks.objType() === "Pack" ) {

		// The param was a single subPack; listify it
		this.subPacks = [ this.subPacks ];
	} else {

		// Anything that isn't an array or a single Pack is an invalid input
		console.error( "Invalid component in params.subPacks" );
		this.subPacks = [];
	}

	// Sanitize tags
	if ( Kiwi.Utils.Common.isArray( params.tags ) ) {
		for ( i = 0; i < params.tags.length; i++ ) {
			tag = params.tags[ i ];
			if ( typeof tag === "number" ||
					typeof tag === "string" ) {
				if ( this.tags.indexOf( tag ) === -1 ) {
					this.tags.push( tag );
				}
			}
		}
	} else {

		// A single, non-list tag will form a list by default
		if ( params.tags ) {
			tag = params.tags;
			if ( typeof tag === "number" ||
					typeof tag === "string" ) {
				this.tags.push( tag );
			}
		}
	}
};

/**
* @module Kiwi.Plugins
* @submodule PipelineNode
* @namespace Kiwi.Plugins.DamagePipeline
*/

/**
* Pipeline Node, a pipeline object that processes Pack objects.
*	<br><br>
*	A PipelineNode receives Packs, performs some operation on them, and then
*	normally passes them on to one or another of its children.
*	Typically if a Pack becomes exhausted it is simply removed and
*	no children are called. The PipelineNode has no knowledge of stack;
*	it can only direct dispatches to its children and expects no response.
*	<br><br>
*	You may customise this node extensively just using the params object.
*	Add children of type PipelineNode or MeterNode, then define
*	an operation function that processes Packs and forwards them
*	to children using "getChildByName".
*	<br><br>
*	To create nodes with your own functionality, use the
*	<code>Kiwi.extend</code> method, and overwrite the
*	<code>_operate</code> function with your own custom code.
*	<br><br>
*
*		// Extend this code only if normal customisation is insufficient
*		var MyNode = function( params ) {
*		
*			// Super
*			Kiwi.Plugins.DamagePipeline.PipelineNode.call( this, params );
*		
*			// Your constructor code goes here
*		};
*		Kiwi.extend( MyNode, Kiwi.Plugins.DamagePipeline.PipelineNode );
*		
*		MyNode.prototype._operate = function( pack ) {
*			// Your operation goes here
*		};
* @class PipelineNode
* @constructor
* @param params {Object} Parameter object
*	@param [params.children] {Array} Array of child nodes, or a single node
*	@param [params.name] {String} Unique identifier for this node
*	@param [params.defaultChildIndex] {Number} Default output
*	@param [params.doDefaultDispatch] {Boolean} Send packs to default output?
*	@param [params.operation] {Function} Function to run on received Packs
*	@param [params.processOnReceive] {Boolean} Whether to process immediately
*	@param [params.processTopDown] {Boolean} Whether to process top-down
*	@param [params.tags] {Array} Array of tags, or a single tag
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode = function( params ) {
	this._parseParams( params );
};

/**
* Adds a child. The child must be a pipeline node, and cannot share a name
*	with other children.
* @method addChild
* @param child {Kiwi.Plugins.DamagePipeline.PipelineNode} The child to add
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.addChild =
		function( child ) {
	if ( child !== this ) {
		if ( child.objType && child.objType() === this.objType() ) {
			if ( !this.getChildByName( child.name ) ) {
				this._children.push( child );
			} else {
				console.error( "Could not add child: name was already in use" );
			}
		} else {
			console.error( "Could not add child: was not PipelineNode type" );
		}
	} else {
		console.error ("Could not add child: child cannot be own parent");
	}
};

/**
* Adds a tag. The tag must be a String or Number, and cannot be a duplicate.
* @method addTag
* @param tag {String} Tag; can be either String or Number
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.addTag = function( tag ) {
	if ( typeof tag === "number" ||
			typeof tag === "string" ) {
		if ( this._tags.indexOf( tag ) === -1 ) {
			this._tags.push( tag );
		}
	}
};

/**
* Removes all children from this node.
* @method clearChildren
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.clearChildren = function() {
	this._children = [];
};

/**
* Removes all tags from this node.
* @method clearTags
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.clearTags = function() {
	this._tags = [];
};

/**
* Attempts to send a pack to another node.
*	Always removes the pack from this node.
*	Deals with situations where the node does not exist,
*	or the pack is exhausted.
*	Call this from the "_operate()" function.
* @method dispatch
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to dispatch
* @param node {Kiwi.Plugins.DamagePipeline.PipelineNode} Target node
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.dispatch =
		function( pack, node ) {
	this.extractPack( pack );

	// Discard if exhausted
	if ( pack.checkExhaustion() ) {
		return;
	}

	// Verify target
	if ( node && node.objType && node.objType() === this.objType() ) {
		this.onDispatch.dispatch( this, pack );
		node.receive( pack );
	}
};

/**
* Attempts to send a pack to the default child node.
*	This is defined by "this.defaultChildIndex" and is normally index 0.
*	Always removes the pack from this node.
*	Deals with situations where the node does not exist,
*	or the pack is exhausted.
*	All packs are sent to default unless "doDefaultDispatch" is
*	set to "false".
* @method dispatchDefault
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to dispatch
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.dispatchDefault =
		function( pack ) {
	var node = this._children[ 0 ];
	this.dispatch( pack, node );
};

/**
* Extracts and returns a pack from any parents
* @method extractPack
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to extract
* @return Kiwi.Plugins.DamagePipeline.Pack
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.extractPack =
		function( pack ) {
	var i,
		packs = this._currentMasterPack.getAllPacks();

	// Remove from all subpacks
	for ( i = 0; i < packs.length; i++ ) {
		packs[ i ].extractSubPack( pack );
	}

	// Remove from internal pack list
	i = this._packs.indexOf( pack );
	if ( i !== -1 ) {
		this._packs.splice( i, 1 );
	}

	return pack;
};

/**
* Returns the child with this name, or null if it does not exist.
*	Searches only direct children.
* @method getChildByName
* @param name {String} Name of desired child node
* @return {Kiwi.Plugins.DamagePipeline.PipelineNode} Child node
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.getChildByName =
		function( name ) {
	var child, i;
	for ( i = 0; i < this._children.length; i++ ) {
		child = this._children[ i ];
		if ( child.name === name ) {
			return child;
		}
	}
	return null;
};

/**
* Returns whether this node has the specified tag.
* @method hasTag
* @param tag {String} Tag; can be either String or Number
* @return Boolean
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.hasTag = function( tag ) {
	var index = this._tags.indexOf( tag );
	if ( index === -1 ) {
		return false;
	}
	return true;
};

/**
* Returns the type of object that this is.
* @method objType
* @return {string}
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.objType = function() {
	return "Pack Pipeline Node";
};

/**
* Core method. Override with your own functions that process and/or
*	dispatch the "pack" parameter.
* @method _operate
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to process
* @private
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype._operate = function( pack ) {
	return pack;
};


/**
* Parses the params object, sets internal properties, and sanitizes input.
* @method _parseParams
* @private
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype._parseParams =
		function( params ) {
	var i;

	params = params || {};

	/**
	* Child nodes of this PipelineNode to which it may pass Packs
	* @property _children
	* @type Array
	* @private
	* @since 0.1.0
	*/
	this._children = [];

	if ( Kiwi.Utils.Common.isArray( params.children ) ) {
		for ( i = 0; i < params.children.length; i++ ) {
			this.addChild( params.children[ i ] );
		}
	} else {

		// A single, non-list child will form a list by default
		if ( params.children ) {
			this.addChild( params.children );
		}
	}

	/**
	* The master pack which will next be dispatched.
	* @property _currentMasterPack
	* @type Kiwi.Plugins.DamagePipeline.Pack
	* @private
	* @since 0.1.0
	*/
	this._currentMasterPack = null;

	/**
	* Index of the default child, to which Packs that do not match
	*	any tags or are otherwise treated as defaults are sent.
	* @property defaultChildIndex
	* @type Number
	* @default 0
	* @public
	* @since 0.1.0
	*/
	this.defaultChildIndex = params.defaultChildIndex || 0;

	/**
	* Whether to send packs to the default dispatch automatically after
	*	running operations
	* @property doDefaultDispatch
	* @type Boolean
	* @default true
	* @public
	* @since 0.1.0
	*/
	this.doDefaultDispatch = typeof params.doDefaultDispatch === "boolean" ?
		params.doDefaultDispatch :
		true;

	/**
	* The name of this node. This is used by the node's parents to select it,
	*	so it should be at least locally unique.
	* @property name
	* @type String
	* @default "Unnamed Node"
	* @public
	* @since 0.1.0
	*/
	this.name = params.name || "Unnamed Node";

	// Load custom operation
	if ( typeof params.operation === "function" ) {
		this._operate = params.operation;
	}

	/**
	* Signal dispatched on pack dispatch
	*	with parameters "this", "pack"
	* @property onDispatch
	* @type Kiwi.Signal
	* @public
	* @since 0.1.0
	*/
	this.onDispatch = new Kiwi.Signal();

	/**
	* Signal dispatched on pack exhaustion
	*	with parameters "this", "pack"
	* @property onExhaust
	* @type Kiwi.Signal
	* @public
	* @since 0.1.0
	*/
	this.onExhaust = new Kiwi.Signal();

	/**
	* List of Packs which the node has received and is currently processing.
	*	Please use the "receive( pack )" method to add packs
	*	from other sources.
	* @property _packs
	* @type Array
	* @private
	* @since 0.1.0
	*/
	this._packs = [];

	/**
	* Whether the node will run "process()" immediately upon receiving
	*	a Pack. If false, you will have to manually run "process()".
	* @property processOnReceive
	* @type Boolean
	* @default true
	* @public
	* @since 0.1.0
	*/
	this.processOnReceive = params.processOnReceive || true;

	/**
	* Whether to process a pack top-down; that is, the master pack
	*	followed by its children. This is DISABLED by default.
	*	If a top-level pack is emptied, its children will be discarded
	*	before they can be processed. For this reason we normally
	*	process bottom-up, doing the children first then their parent.
	*	However, in some cases it may be useful to extract the topmost
	*	case of a tag, not the bottommost, so this flag is provided.
	*
	* @property processTopDown
	* @type Boolean
	* @default false
	* @public
	* @since 0.1.0
	*/
	this.processTopDown = params.processTopDown || false;

	/**
	* List of tags on this node.
	*	The node will pass any Packs that don't share any tags
	*	on to the child defined by "defaultChildIndex"
	*	without running "_operate()" on those Packs.
	*	All matching Packs will incur operation.
	* @property _tags
	* @type Array
	* @private
	* @since 0.1.0
	*/
	this._tags = [];

	if ( Kiwi.Utils.Common.isArray( params.tags ) ) {
		for ( i = 0; i < params.tags.length; i++ ) {
			this.addTag( params.tags[ i ] );
		}
	} else if ( params.tags ) {

		// A single, non-list tag will form a list by default
		this.addTag( params.tags );
	}
};

/**
* Performs the node operation on all current packs.
*	The operation is only performed on those packs which match a tag of 
*	this node. If this node has no tags, all nodes are processed.
*	All nodes are subsequently sent to dispatchDefault unless
*	doDefaultDispatch has been set to false.
*	<br><br>
*	The process goes through each pack bottom-up;
*	the deepest children are evaluated first, working up to
*	the root pack.
*	<br><br>
*	If you want to evaluate top-down, set processTopDown to true.
*	Be careful when evaulating top-down, as you may cause packs
*	to be discarded with a parent before they are processed.
*	<br><br>
*	This is normally called directly after damage is received.
*	However, if you have not set the processOnReceive flag,
*	it will not execute immediately. You can call it according
*	to your own requirements.
* @method process
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.process = function() {

	var i, j, pack, subPacks, subPacksLength;

	for ( i = this._packs.length - 1; i >= 0; i-- ) {
		pack = this._packs[ i ];
		this._currentMasterPack = pack;

		if ( this.processTopDown ) {

			// Step through subpacks from top to bottom,
			// rebuilding in case the pack structure changes during processing.
			subPacks = pack.getAllPacks();
			subPacks.reverse();
			subPacksLength = subPacks.length;
			j = 0;
			while ( j < subPacksLength ) {
				if ( subPacks[ j ].hasTagInArray( this._tags ) ) {
					this._operate( subPacks[ j ] );
					if ( subPacks[ j ].checkExhaustion() ) {
						this.onExhaust.dispatch( this, subPacks[ j ] );
					}
				}
				subPacks = pack.getAllPacks();
				subPacks.reverse();
				subPacksLength = subPacks.length;
				j++;
			}
		} else {

			// Create a subPacks array which ends with the root pack
			subPacks = pack.getAllPacks();
			for ( j = 0; j < subPacks.length; j++ ) {
				if ( subPacks[ j ].hasTagInArray( this._tags ) ) {
					this._operate( subPacks[ j ] );
					if ( subPacks[ j ].checkExhaustion() ) {
						this.onExhaust.dispatch( this, subPacks[ j ] );
					}
				}
			}
		}

		// Default dispatch only if the pack has not been removed already
		if ( this.doDefaultDispatch && this._packs.indexOf( pack ) !== -1 ) {
			this.dispatchDefault( pack );
		}
	}
};

/**
* Receives a damage pack
* @method receive
* @param pack {Kiwi.Plugins.DamagePipeline.Pack} Pack to receive
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.receive =
		function( pack ) {
	if ( pack.objType() === "Pack" ) {
		if ( !pack.checkExhaustion() ) {
			this._packs.push( pack );

			// Trigger processing
			if ( this.processOnReceive ) {
				this.process();
			}
		}
	}
};

/**
* Removes a child, if it is currently a child.
* @method removeChild
* @param child {Kiwi.Plugins.DamagePipeline.PipelineNode} The child to remove
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.removeChild =
		function( child ) {
	var index = this._children.indexOf( child );
	if ( index !== -1 ) {
		this._children.splice( index, 1 );
	}
};

/**
* Removes a tag, if it is currently a tag.
* @method removeTag
* @param tag {String} Tag; can be either String or Number
* @public
* @since 0.1.0
*/
Kiwi.Plugins.DamagePipeline.PipelineNode.prototype.removeTag = function( tag ) {
	var index = this._tags.indexOf( tag );
	if ( index !== -1 ) {
		this._tags.splice( index, 1 );
	}
};

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
