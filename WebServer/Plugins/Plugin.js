/**
 * @fileoverview Module class for plugins to extend
 * @author Donald Elrod
 * @version 1.0.0
*/

/**
 * Class representing a generic Module, which can be extended to allow new types of Modules to be implemented
 */
class Plugin {
    constructor() {

    }

    /**
     * Function to setup the function, which can include setting functions to run at intervals, connecting to a service, modifying parts of the passed Plugin object, and other tasks to implement the functionality of the plugin
     */
    async setup(Plugin) {

    }

    /**
     * Function that returns devices that could register the if a person is home. An example of this would be the Netgear router plugin, which overrides this function in order to return a list of connected devices so they can be used in the checkWhoIsHome function
     */
    async getPresence() {

    }


}

module.exports = Plugin;