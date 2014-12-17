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
