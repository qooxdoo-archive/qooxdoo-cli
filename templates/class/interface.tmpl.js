${header}

/**
 * This is a qooxdoo interface
 *
 */
qx.Interface.define("${classname}",
{
  
  //extend : my.extended.interface,  

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
    myMethod : function(foo, bar){}
  }
});