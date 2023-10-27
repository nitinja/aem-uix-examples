/*
 * <license header>
 */

import { Text } from "@adobe/react-spectrum";
import { register } from "@adobe/uix-guest";
import { extensionId } from "./Constants";
import actions from '../config.json';
import actionWebInvoke from "../utils.js";

function ExtensionRegistration() {
  const init = async () => {
    const guestConnection = await register({
      id: extensionId,
      methods: {
        headerMenu: {
          getButtons() {
            return [
              // YOUR HEADER BUTTONS CODE SHOULD BE HERE
              {
                'id': 'cf-export',
                'label': 'CF Export',
                'icon': 'OpenIn',
                async onClick() {
                  console.log("UIX Export has been pressed.");

                  guestConnection.host.toaster.display({
                    variant: "positive",
                    message: "Export generation has started. The download will begin automatically once the process is complete.",
                    timeout: 3000,
                  });

                  // const filters = await guestConnection.host.fragmentSelector.getFilters();
                  // console.log('Filters: ', JSON.stringify(filters));
                  const filters = ["test"];

                  const presignUrl = await actionWebInvoke(
                      actions['export-content-fragments'],
                      {},
                      {
                        filters,
                        authConfig: guestConnection.sharedContext.get('auth'),
                        aemHost: guestConnection.sharedContext.get('aemHost'),
                      },
                      { method: 'POST' }
                  );

                  if (presignUrl.error) {
                    guestConnection.host.toaster.display({
                      variant: "negative",
                      message: "Export generation encountered an error.",
                      timeout: 3000,
                    });
                    return;
                  }

                  // console.log(presignUrl);
                  window.open(presignUrl);
                },
              },
            ];
          },
        },
      },
    });
  };
  init().catch(console.error);

  return <Text>IFrame for integration with Host (AEM)...</Text>;
}

export default ExtensionRegistration;
