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
