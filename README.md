# Final
## Configuración inicial

Para que el programa funcione correctamente después de clonar el repositorio, es necesario configurar las variables de entorno.

El repositorio incluye un archivo llamado .env.example, que contiene la estructura y los nombres de todas las variables requeridas por la aplicación.

Pasos:
Crea una copia del archivo .env.example
Renómbrala como .env
Guarda los cambios antes de ejecutar la aplicación.
Este paso es obligatorio para el correcto funcionamiento del sistema.

## Instalación de dependencias

Asegúrate de tener instalado Node.js. Luego, ejecuta el siguiente comando en la raíz del proyecto:

npm install

## Ejecución de la aplicación

Después de clonar el repositorio, encontrarás dos carpetas:

/frontend
/backend

Debes iniciar una terminal (CMD) en cada una de ellas.

Backend.
Abre una terminal en la carpeta backend.
Ejecuta los siguientes comandos:
npm install
npm install dotenv
npx prisma generate
npm run start:dev

Frontend.
Abre una terminal en la carpeta frontend.
Ejecuta los siguientes comandos:
npm install
npm install react react-dom react-router-dom
npm run dev

abre tu navegador y entrar a localhost generalnmente:
 
http://localhost:5173/