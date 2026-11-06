import {register} from '@optimizely/cms-extensibility-sdk';

import {ProductPicker} from './picker/ProductPicker';

// The one property-editor entry; app.yml binds it to long strings (string, no format).
register((context) => <ProductPicker context={context} />);
