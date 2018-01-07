/* ************************************************************************

  ${name}

  ${homepage}

  Copyright: 
    ${copyright}

  License: 
    ${license}
    See the LICENSE file in the project's top-level directory for details.

  Authors: 
    ${authors}

************************************************************************ */

/**
 * This is a qooxdoo class
 *
 * //@asset(${namespace}/*)
 * //@require(${namespace}/*)
 */
qx.Class.define("${classname}",
{
  
  extend : ${extend},
  include : [],

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Create a new instance
   */
  construct : function() {
  	
  },

/*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** The foo property of the object */
    foo :
    {
      apply : "_applyFoo",
      nullable : true,
      check : "String",
      event : "changeFoo"
    }
  },
  

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /** Fired when something happens */
    "changeSituation" : "qx.event.type.Data"
  },  

  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** The foo static property of the class object */
    FOO : "bar"
  },  

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * First method
     * @param foo {String} The foo parameter
     * @param foo {Number} The bar parameter
     * @return {String} The result of the method.
     */
    myMethod : function()
    {
    },
    
    /**
     * First apply method
     */
    _applyFoo : function(value, old)
    {
    }    
  },

  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
  }  
});