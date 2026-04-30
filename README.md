# Final
## Configuración inicial

Para que el programa funcione correctamente después de clonar el repositorio, es necesario configurar las variables de entorno. <br>

El repositorio incluye un archivo llamado .env.example, que contiene la estructura y los nombres de todas las variables requeridas por la aplicación. <br>


Pasos: <br>
Crea una copia del archivo .env.example <br>

Renómbrala como .env <br>

Guarda los cambios antes de ejecutar la aplicación. <br>

Este paso es obligatorio para el correcto funcionamiento del sistema. <br>


## Instalación de dependencias <br>

Asegúrate de tener instalado Node.js. Luego, ejecuta el siguiente comando en la raíz del proyecto: <br>

npm install <br>

## Ejecución de la aplicación <br>

Después de clonar el repositorio, encontrarás dos carpetas: <br>

/frontend <br>
/backend

Debes iniciar una terminal (CMD) en cada una de ellas. <br>

Backend. <br>
Abre una terminal en la carpeta backend. <br>
Ejecuta los siguientes comandos: <br>
npm install <br>
npm install dotenv <br>
npx prisma generate <br>
npm run start:dev <br>

Frontend. <br>
Abre una terminal en la carpeta frontend. <br>
Ejecuta los siguientes comandos: <br>
npm install <br>
npm install react react-dom react-router-dom <br>
npm run dev <br>

Existen dos formas de acceder al sistema:

Desde el navegador: <br>
Abre tu navegador e ingresa a localhost utilizando la URL que aparece en el frontend. <br>
<img width="432" height="164" alt="image" src="https://github.com/user-attachments/assets/70783678-8ca7-4c03-8a7e-254750ac08c3" /> <br>

Modo escritorio:
Asegúrate de tener en ejecución ambos entornos (backend y frontend). Luego, desde la carpeta raíz del proyecto, ejecuta el siguiente comando:
<br>
npm run dev:desktop

