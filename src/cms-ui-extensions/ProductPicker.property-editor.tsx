import {register} from '@optimizely/cms-extensibility-sdk';

import {ProductPicker} from './picker/ProductPicker';

// The one property-editor entry. app.yml offers it for long strings (string, no format);
// an admin binds it to a property in the content type's User Interface -> Editor.
register((context) => <ProductPicker context={context} />);
