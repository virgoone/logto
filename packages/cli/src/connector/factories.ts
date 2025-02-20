import chalk from 'chalk';

import { notImplemented } from './consts.js';
import { loadConnector } from './loader.js';
import type { ConnectorFactory, ConnectorPackage } from './types.js';
import { parseMetadata, validateConnectorModule } from './utils.js';

// eslint-disable-next-line @silverhand/fp/no-let
let cachedConnectorFactories: ConnectorFactory[] | undefined;

export const loadConnectorFactories = async (
  connectorPackages: ConnectorPackage[],
  ignoreVersionMismatch: boolean
) => {
  if (cachedConnectorFactories) {
    return cachedConnectorFactories;
  }
  const connectorFactories = await Promise.all(
    connectorPackages.map(async ({ path: packagePath, name }) => {
      try {
        const createConnector = await loadConnector(packagePath, ignoreVersionMismatch);
        const rawConnector = await createConnector({ getConfig: notImplemented });
        validateConnectorModule(rawConnector);

        return {
          metadata: await parseMetadata(rawConnector.metadata, packagePath),
          type: rawConnector.type,
          createConnector,
          path: packagePath,
        };
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.log(
            `${chalk.red(
              `[load-connector] skip ${chalk.bold(name)} due to error: ${error.message}`
            )}`
          );

          return;
        }

        throw error;
      }
    })
  );

  // eslint-disable-next-line @silverhand/fp/no-mutation
  cachedConnectorFactories = connectorFactories.filter(
    (connectorFactory): connectorFactory is ConnectorFactory => connectorFactory !== undefined
  );

  return cachedConnectorFactories;
};
